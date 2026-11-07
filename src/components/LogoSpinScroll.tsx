"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useFramePreloader,
  type FrameManifestInput,
  type FrameManifest as FrameLoaderManifest,
  globalFrameCache,
} from "@/lib/frameLoader";

import {
  BREAKPOINTS,
  useReducedMotion as useMotionReducedMotion,
  useIsMobile,
  useTouchDevice,
  shouldUseHeavyCanvas,
  getPosterFrameIndex,
  touchScrollProps,
} from "@/lib/motion";
import { SpinPoster } from "@/components/SpinPoster";

export { useReducedMotion } from "@/lib/motion";

/* -------------------------------------------------------------------------- */
/* Public types                                                                */
/* -------------------------------------------------------------------------- */

export type LogoSpinFrameInput =
  | string
  | { src?: string; url?: string; path?: string; file?: string; name?: string };

export type LogoSpinManifest = FrameLoaderManifest & {
  /** SA-06 style resolution table. */
  resolutions?: Array<{
    size: number;
    width?: number;
    height?: number;
    directory: string;
    count?: number;
    filePattern?: string;
    zeroPadding?: number;
  }>;
  frameCount?: number;
  preview?: { width?: number; height?: number; file?: string };
  /** Directory / base URL / base path that relative frame entries resolve against. */
  basePath?: string;
  baseUrl?: string;
  frameBasePath?: string;
  dir?: string;
  path?: string;
};

export type LogoSpinScrollProps = {
  /** Manifest (SA-06 resolution format, frameLoader format, array, or URL). */
  manifest?: LogoSpinManifest | LogoSpinFrameInput[] | string | number | null;
  /** Overrides the base path derived from the manifest. */
  frameBasePath?: string;
  /** Direct list of frame URLs/paths, takes precedence over manifest. */
  frames?: string[];
  /** Approximate pinned section height in vh (default 450). */
  heightVh?: number;
  /** Lerp factor applied to the frame index each animation frame (default 0.12). */
  smoothing?: number;
  /** Which frame to show when motion is reduced / static (default "last"). */
  staticFrame?: "first" | "last" | "middle" | number;
  /** Force reduced-motion (static) behaviour. */
  reducedMotion?: boolean;
  /** Auto-detect prefers-reduced-motion (default true). */
  autoDetectReducedMotion?: boolean;
  /** Preload concurrency (default 6). */
  preloadConcurrency?: number;
  /** Choose a specific resolution size for SA-06 manifests (256/512). */
  frameSize?: number | "auto";
  /** Image quality preference for decision-making (default "high"). */
  quality?: "low" | "high";
  /** Shown while frames are loading. */
  loader?: React.ReactNode;
  /** Shown when no frames are available / before load. */
  fallback?: React.ReactNode;
  /** Accessible label for the section/canvas. */
  ariaLabel?: string;
  className?: string;
  onProgress?: (loaded: number, total: number) => void;
  onFrameChange?: (index: number) => void;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const DEFAULT_MANIFEST_PATH = "/frames/manifest.json";

/**
 * Adapt SA-06 / frameLoader manifests into a frameLoader-compatible input.
 * Returns 0 (no frames) until ready.
 */
function adaptManifest(
  raw: LogoSpinManifest | LogoSpinFrameInput[] | number | null,
  options: {
    basePath?: string;
    frameSize?: number | "auto";
    quality?: "low" | "high";
  },
): FrameManifestInput {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === "number") return raw;
  if (Array.isArray(raw)) {
    return { frames: raw as unknown as string[], basePath: options.basePath } as unknown as FrameManifestInput;
  }

  const manifest = raw as LogoSpinManifest;

  // SA-06 resolution-style manifest.
  if (Array.isArray(manifest.resolutions) && manifest.resolutions.length > 0) {
    const base =
      options.basePath ||
      manifest.basePath ||
      manifest.baseUrl ||
      manifest.frameBasePath ||
      manifest.dir ||
      manifest.path ||
      "";

    const count = manifest.frameCount ?? manifest.resolutions[0]?.count ?? 0;

    // Pick resolution sizes.
    let highSize = Number(manifest.resolutions.map((r) => r.size).sort((a, b) => b - a)[0]);
    let lowSize = Number(manifest.resolutions.map((r) => r.size).sort((a, b) => a - b)[0]);
    if (options.frameSize && options.frameSize !== "auto") {
      const picked = manifest.resolutions.find((r) => r.size === options.frameSize);
      if (picked) highSize = lowSize = picked.size;
    }

    const highRes = manifest.resolutions.find((r) => r.size === highSize) ?? manifest.resolutions[0];
    const lowRes = manifest.resolutions.find((r) => r.size === lowSize) ?? highRes;

    const makeManifest = (
      resolution: (typeof manifest.resolutions)[number],
    ): FrameLoaderManifest => ({
      frameCount: resolution.count ?? count,
      lowBasePath:
        base && lowRes?.directory ? `${base.replace(/\/+$/, "")}/${lowRes.directory}` : undefined,
      highBasePath:
        base && highRes?.directory ? `${base.replace(/\/+$/, "")}/${highRes.directory}` : undefined,
      filePattern: resolution.filePattern ?? highRes?.filePattern ?? "frame_{index}.webp",
      ext: manifest.format,
      pad: resolution.zeroPadding ?? highRes?.zeroPadding ?? 3,
      startIndex: 0,
      concurrency: manifest.concurrency,
    });

    return makeManifest(highRes);
  }

  // Already a frameLoader-style manifest; apply base path override.
  const adapted: FrameLoaderManifest = { ...(manifest as FrameLoaderManifest) };
  if (options.basePath) {
    if (!adapted.basePath) adapted.basePath = options.basePath;
    if (!adapted.highBasePath) adapted.highBasePath = options.basePath;
    if (!adapted.lowBasePath) adapted.lowBasePath = options.basePath;
  }
  if (options.quality === "low" && !adapted.basePath && manifest.dir) {
    adapted.basePath = manifest.dir;
  }
  return adapted;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function LogoSpinScroll(props: LogoSpinScrollProps) {
  const {
    manifest: manifestProp = DEFAULT_MANIFEST_PATH,
    frameBasePath,
    frames: directFrames,
    heightVh = 450,
    smoothing = 0.12,
    reducedMotion: reducedMotionProp,
    autoDetectReducedMotion = true,
    preloadConcurrency = 6,
    frameSize = "auto",
    quality = "high",
    loader,
    fallback,
    ariaLabel = "HORIZON logo rotation",
    className,
    onProgress,
    onFrameChange,
  } = props;

  const prefersReduced = useMotionReducedMotion();
  const reducedEffective =
    reducedMotionProp ?? (autoDetectReducedMotion ? prefersReduced : false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const staticMode = !mounted || reducedEffective;

  /* Touch / small-screen decision via SA-10. */
  const isSmall = useIsMobile(BREAKPOINTS.md);
  const isTouch = useTouchDevice();
  const decision = shouldUseHeavyCanvas({
    reducedMotion: reducedEffective || !mounted,
    isSmallScreen: isSmall,
    isTouch,
  });
  const useCanvas = mounted && !staticMode && decision.useCanvas;
  const usePoster = !useCanvas;

  /* Intersection observer lazy. */
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setInView(true);
      },
      { rootMargin: "400px 0px", threshold: 0.01 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  /* Manifest resolution (supports URL strings). */
  const [resolvedManifest, setResolvedManifest] = useState<LogoSpinManifest | LogoSpinFrameInput[] | number | null>(
    typeof manifestProp === "string" ? null : (manifestProp ?? null),
  );
  const [manifestError, setManifestError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof manifestProp !== "string") {
      setResolvedManifest(manifestProp ?? null);
      setManifestError(null);
      return;
    }
    if (!inView) return;
    let cancelled = false;
    setManifestError(null);
    fetch(manifestProp)
      .then((res) => {
        if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setResolvedManifest(json);
      })
      .catch((err) => {
        if (!cancelled) setManifestError(err as Error);
      });
    return () => {
      cancelled = true;
    };
  }, [manifestProp, inView]);

  const manifestInput: FrameManifestInput = useMemo(() => {
    if (!inView) return 0;
    if (directFrames && directFrames.length) {
      return { frames: directFrames, basePath: frameBasePath };
    }
    const resolvedForAdapt =
      directFrames && directFrames.length ? { frames: directFrames } : resolvedManifest;
    return adaptManifest(
      resolvedForAdapt as LogoSpinManifest | LogoSpinFrameInput[] | number | null,
      {
      basePath: frameBasePath,
      frameSize,
      quality,
    }) as FrameManifestInput;
  }, [inView, directFrames, resolvedManifest, frameBasePath, frameSize, quality]);

  const preloader = useFramePreloader(manifestInput, {
    cache: globalFrameCache,
    concurrency: preloadConcurrency,
    autoStart: true,
  });

  const onProgressRef = useRef(onProgress);
  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);
  useEffect(() => {
    onProgressRef.current?.(
      preloader.loadedLow + preloader.loadedHigh,
      preloader.totalAssets > 0 ? preloader.totalAssets : preloader.total * 2,
    );
  }, [
    preloader.loadedLow,
    preloader.loadedHigh,
    preloader.totalAssets,
    preloader.total,
  ]);

  const onFrameChangeRef = useRef(onFrameChange);
  useEffect(() => {
    onFrameChangeRef.current = onFrameChange;
  }, [onFrameChange]);

  const frames = preloader.frames.filter(Boolean) as HTMLImageElement[];
  const framesRef = useRef<HTMLImageElement[]>([]);
  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  // staticFrame handling is delegated to SpinPoster/poster mode when canvas disabled.

  /* Canvas refs. */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentFrameRef = useRef(0);
  const targetProgressRef = useRef(0);
  const drawnIndexRef = useRef(-1);
  const dprRef = useRef(1);
  const sizeRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef<number | null>(null);

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const imgs = framesRef.current;
    if (!canvas || !ctx || imgs.length === 0) return;
    const idx = clamp(index, 0, imgs.length - 1);
    const img = imgs[idx];
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const imgAspect = (img.naturalWidth || 1) / (img.naturalHeight || 1);
    const canvasAspect = w / (h || 1);
    let dw: number;
    let dh: number;
    if (imgAspect > canvasAspect) {
      dw = w;
      dh = w / imgAspect;
    } else {
      dh = h;
      dw = h * imgAspect;
    }
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    onFrameChangeRef.current?.(idx);
  }, []);

  const computeProgress = useCallback((): number => {
    const el = sectionRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const total = el.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    return clamp(-rect.top / total, 0, 1);
  }, []);

  /* Resize + DPR. */
  useEffect(() => {
    if (!useCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const update = (): void => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      sizeRef.current = { w, h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawFrame(Math.round(currentFrameRef.current));
    };
    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    if (ro) ro.observe(canvas.parentElement ?? canvas);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [useCanvas, drawFrame, frames.length]);

  /* Scroll + rAF smoothing. */
  useEffect(() => {
    if (!useCanvas) return;
    if (frames.length === 0) return;
    const onScroll = (): void => {
      targetProgressRef.current = computeProgress();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    let running = true;
    const loop = (): void => {
      if (!running) return;
      const count = framesRef.current.length;
      if (count > 0) {
        const targetIndex = targetProgressRef.current * (count - 1);
        const factor = clamp(smoothing, 0.01, 1);
        currentFrameRef.current += (targetIndex - currentFrameRef.current) * factor;
        currentFrameRef.current = clamp(currentFrameRef.current, 0, count - 1);
        const idx = Math.round(currentFrameRef.current);
        if (idx !== drawnIndexRef.current) {
          drawnIndexRef.current = idx;
          drawFrame(idx);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [useCanvas, frames.length, computeProgress, smoothing, drawFrame]);

  /* Poster frame tracking (when canvas disabled but frames exist). */
  const [posterIndex, setPosterIndex] = useState(0);
  useEffect(() => {
    if (useCanvas) return;
    if (frames.length === 0) return;
    const onScroll = (): void => {
      const progress = computeProgress();
      setPosterIndex(getPosterFrameIndex(progress, frames.length));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [useCanvas, frames.length, computeProgress]);

  const touchProps = touchScrollProps();

  const anyError = preloader.error ?? manifestError;

  const posterFrames = frames.map((f) => f.src);

  return (
    <section
      ref={sectionRef}
      className={["relative w-full", className].filter(Boolean).join(" ")}
      style={{ height: useCanvas ? `${heightVh}vh` : "auto" }}
      aria-label={ariaLabel}
    >
      {usePoster ? (
        <div className="flex items-center justify-center py-10">
          {preloader.isFirstFrameReady || frames.length > 0 ? (
            <SpinPoster
              frames={posterFrames.length ? posterFrames : undefined}
              frame={posterIndex}
              src={preloader.firstFrame?.src ?? "/brand/horizon-mark-512.png"}
              alt={ariaLabel}
              width={512}
              height={512}
              priority={inView}
              forceStatic
            />
          ) : fallback ? (
            fallback
          ) : (
            <div className="text-sm text-[var(--muted)]">
              {anyError ? anyError.message : loader ? loader : "Loading…"}
            </div>
          )}
          {loader && preloader.isLoading && (
            <div className="mt-4 w-full text-center">{loader}</div>
          )}
        </div>
      ) : (
        <div
          className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden bg-[var(--bg)]"
          style={touchProps.style}
        >
          {(preloader.isLoading || preloader.progressRatio < 1) && preloader.total > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              {loader ?? (
                <div className="text-sm text-[var(--muted)] font-mono tabular-nums">
                  {Math.round(preloader.progress)}%
                </div>
              )}
            </div>
          )}
          {anyError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center text-sm text-[var(--danger)]">
              {anyError.message}
            </div>
          )}
          {!preloader.isFirstFrameReady && !anyError && (
            <div className="absolute inset-0 z-10 flex items-center justify-center text-sm text-[var(--muted)]">
              {fallback ?? "Loading…"}
            </div>
          )}
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={ariaLabel}
            className="block max-h-full max-w-full"
          />
        </div>
      )}
    </section>
  );
}