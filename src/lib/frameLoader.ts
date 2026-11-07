"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type FrameQuality = "low" | "high";

export interface FrameSource {
  low?: string;
  high?: string;
  src?: string;
  url?: string;
  path?: string;
  file?: string;
  name?: string;
  index?: number;
}

export interface FrameManifest {
  frames?: number | string[] | FrameSource[];
  frameCount?: number;
  totalFrames?: number;
  count?: number;

  urls?: string[];
  lowResUrls?: string[];
  lowUrls?: string[];
  lowFrames?: (string | FrameSource)[];
  highResUrls?: string[];
  highUrls?: string[];
  highFrames?: (string | FrameSource)[];

  getUrl?: (index: number, quality: FrameQuality) => string | undefined;
  urlFor?: (index: number, quality: FrameQuality) => string | undefined;
  getFrameUrl?: (index: number, quality: FrameQuality) => string | undefined;
  getFrameSrc?: (index: number, quality: FrameQuality) => string | undefined;
  frameUrl?: (index: number, quality: FrameQuality) => string | undefined;

  basePath?: string;
  baseUrl?: string;
  path?: string;
  lowBasePath?: string;
  highBasePath?: string;

  pattern?: string;
  filePattern?: string;
  template?: string;
  lowPattern?: string;
  highPattern?: string;

  extension?: string;
  ext?: string;
  format?: string;
  pad?: number;
  padding?: number;
  startIndex?: number;
  start?: number;
  firstIndex?: number;

  cache?: FrameCache;
  cacheKey?: string;
  concurrency?: number;
  batch?: number;
  crossOrigin?: string;
  autoStart?: boolean;
}

export type FrameManifestInput =
  | number
  | string[]
  | FrameSource[]
  | FrameManifest;

export interface FrameCache {
  get(url: string): HTMLImageElement | Promise<HTMLImageElement> | undefined;
  set(url: string, value: HTMLImageElement | Promise<HTMLImageElement>): void;
  has(url: string): boolean;
  delete?(url: string): void;
  clear?(): void;
}

export function createFrameCache(initial?: Iterable<[string, HTMLImageElement | Promise<HTMLImageElement>]>): FrameCache {
  const map = new Map<string, HTMLImageElement | Promise<HTMLImageElement>>(initial);
  return {
    get: (url) => map.get(url),
    set: (url, value) => {
      map.set(url, value);
    },
    has: (url) => map.has(url),
    delete: (url) => {
      map.delete(url);
    },
    clear: () => {
      map.clear();
    },
  };
}

// A shared, optional global cache. Consumers can opt in by passing it.
export const globalFrameCache = createFrameCache();

export interface FramePreloadOptions {
  cache?: FrameCache;
  concurrency?: number;
  autoStart?: boolean;
  crossOrigin?: string;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
  onFrame?: (index: number, quality: FrameQuality, image: HTMLImageElement) => void;
}

export interface FramePreloadState {
  frames: (HTMLImageElement | null)[];
  lowResFrames: (HTMLImageElement | null)[];
  highResFrames: (HTMLImageElement | null)[];
  firstFrame: HTMLImageElement | null;
  progress: number;
  progressRatio: number;
  loadedLow: number;
  loadedHigh: number;
  total: number;
  totalAssets: number;
  isLowResReady: boolean;
  isFirstFrameReady: boolean;
  isComplete: boolean;
  isLoading: boolean;
  error: Error | null;
  cancel: () => void;
  restart: () => void;
}

interface NormalizedManifest {
  count: number;
  getLowUrl: (index: number) => string | undefined;
  getHighUrl: (index: number) => string | undefined;
  cache?: FrameCache;
  concurrency: number;
  crossOrigin?: string;
}

function toArray(value: unknown): string[] | FrameSource[] | undefined {
  if (Array.isArray(value)) return value as string[] | FrameSource[];
  return undefined;
}

function resolveGetter(manifest: FrameManifest): ((index: number, quality: FrameQuality) => string | undefined) | undefined {
  const candidates = [
    manifest.getUrl,
    manifest.urlFor,
    manifest.getFrameUrl,
    manifest.getFrameSrc,
    manifest.frameUrl,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "function") {
      return candidate as (index: number, quality: FrameQuality) => string | undefined;
    }
  }
  return undefined;
}

function collectArrays(manifest: FrameManifest): {
  low: string[];
  high: string[];
} {
  const low: string[] = [];
  const high: string[] = [];

  const lowDirect = manifest.lowResUrls || manifest.lowUrls || manifest.lowFrames;
  const highDirect =
    manifest.highResUrls || manifest.highUrls || manifest.highFrames || manifest.urls;

  if (Array.isArray(lowDirect)) {
    for (const item of lowDirect) {
      if (typeof item === "string") low.push(item);
      else if (item && typeof item === "object") {
        const source = item as FrameSource;
        low.push(source.low || source.src || source.url || source.path || source.file || source.high || "");
      }
    }
  }

  if (Array.isArray(highDirect)) {
    for (const item of highDirect) {
      if (typeof item === "string") high.push(item);
      else if (item && typeof item === "object") {
        const source = item as FrameSource;
        high.push(source.high || source.src || source.url || source.path || source.file || source.low || "");
      }
    }
  }

  if (Array.isArray(manifest.frames)) {
    for (const item of manifest.frames) {
      if (typeof item === "string") {
        if (high.length === 0 || high.length < manifest.frames.length) {
          // align by index when possible
        }
        high.push(item);
        if (low.length < manifest.frames.length) low.push(item);
      } else if (item && typeof item === "object") {
        const source = item as FrameSource;
        low.push(source.low || source.src || source.url || source.high || "");
        high.push(source.high || source.src || source.url || source.low || "");
      }
    }
  }

  // Normalize lengths: if only high provided, mirror to low (progressive still works).
  if (low.length === 0 && high.length > 0) {
    low.push(...high);
  }

  return { low, high };
}

function padIndex(index: number, pad: number, startIndex: number): string {
  const value = index + startIndex;
  return String(value).padStart(pad, "0");
}

function buildPathUrl(base: string | undefined, pattern: string | undefined, index: number, pad: number, ext: string | undefined, startIndex: number): string | undefined {
  if (!base && !pattern) return undefined;
  const idx = padIndex(index, pad, startIndex);
  const extClean = ext ? (ext.startsWith(".") ? ext : `.${ext}`) : "";
  let file = pattern || `{index}${extClean}`;
  file = file.replace(/\{index\}/g, idx).replace(/\{i\}/g, idx);
  if (base) {
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${cleanBase}/${file}`;
  }
  return file;
}

export function normalizeManifest(input: FrameManifestInput, options?: FramePreloadOptions): NormalizedManifest {
  const manifest: FrameManifest = typeof input === "number"
    ? { frameCount: input }
    : Array.isArray(input)
      ? { frames: input as string[] | FrameSource[] }
      : (input || {});

  const { low, high } = collectArrays(manifest);
  const getter = resolveGetter(manifest);

  let count =
    manifest.frameCount ??
    manifest.totalFrames ??
    manifest.count ??
    (Array.isArray(manifest.frames) ? manifest.frames.length : undefined) ??
    low.length ??
    high.length ??
    0;

  if (count <= 0 && high.length > 0) count = high.length;
  if (count <= 0 && low.length > 0) count = low.length;

  const pad = manifest.pad ?? manifest.padding ?? 4;
  const startIndex = manifest.startIndex ?? manifest.start ?? manifest.firstIndex ?? 1;
  const ext = manifest.extension ?? manifest.ext;

  const lowBase = manifest.lowBasePath;
  const highBase = manifest.highBasePath ?? manifest.basePath ?? manifest.baseUrl ?? manifest.path;

  const lowPattern = manifest.lowPattern ?? manifest.pattern ?? manifest.filePattern ?? manifest.template;
  const highPattern = manifest.highPattern ?? manifest.pattern ?? manifest.filePattern ?? manifest.template;

  const concurrency = options?.concurrency ?? manifest.concurrency ?? manifest.batch ?? 6;
  const crossOrigin = options?.crossOrigin ?? manifest.crossOrigin;

  const cache = options?.cache ?? manifest.cache;

  const getLowUrl = (index: number): string | undefined => {
    if (low[index]) return low[index];
    if (getter) {
      try {
        const result = getter(index, "low");
        if (result) return result;
      } catch {
        // ignore
      }
    }
    if (lowBase || lowPattern) {
      const url = buildPathUrl(lowBase ?? highBase, lowPattern ?? highPattern, index, pad, ext, startIndex);
      if (url) return url;
    }
    if (high[index]) return high[index];
    if (getter) {
      try {
        return getter(index, "high");
      } catch {
        return undefined;
      }
    }
    return buildPathUrl(highBase, highPattern, index, pad, ext, startIndex);
  };

  const getHighUrl = (index: number): string | undefined => {
    if (high[index]) return high[index];
    if (getter) {
      try {
        const result = getter(index, "high");
        if (result) return result;
      } catch {
        // ignore
      }
    }
    if (highBase || highPattern) {
      const url = buildPathUrl(highBase, highPattern, index, pad, ext, startIndex);
      if (url) return url;
    }
    // fallback to low
    if (low[index]) return low[index];
    if (getter) {
      try {
        return getter(index, "low");
      } catch {
        return undefined;
      }
    }
    return getLowUrl(index);
  };

  return {
    count: Math.max(0, count),
    getLowUrl,
    getHighUrl,
    cache,
    concurrency: Math.max(1, concurrency),
    crossOrigin,
  };
}

async function loadImage(
  url: string | undefined,
  cache: FrameCache | undefined,
  signal: AbortSignal | undefined,
  crossOrigin: string | undefined
): Promise<HTMLImageElement | null> {
  if (!url) return null;

  if (cache?.has(url)) {
    try {
      const cached = await Promise.resolve(cache.get(url));
      if (cached instanceof HTMLImageElement) return cached;
      if (cached) return cached as HTMLImageElement;
    } catch {
      // fall through to reload
    }
  }

  return new Promise<HTMLImageElement>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;

    let settled = false;
    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
    };

    const onAbort = () => {
      if (settled) return;
      settled = true;
      img.src = "";
      cleanup();
      reject(new DOMException("Aborted", "AbortError"));
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    img.onload = () => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      // Decode to avoid jank when drawing to canvas.
      if (typeof img.decode === "function") {
        img
          .decode()
          .then(() => {
            cleanup();
            resolve(img);
          })
          .catch(() => {
            cleanup();
            resolve(img);
          });
      } else {
        cleanup();
        resolve(img);
      }
    };

    img.onerror = () => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      cleanup();
      reject(new Error(`Failed to load image: ${url}`));
    };

    // Setting src begins the request.
    img.src = url;

    if (cache) {
      cache.set(url, img);
    }
  });
}

async function loadIndices(
  indices: number[],
  normalized: NormalizedManifest,
  refs: { low: (HTMLImageElement | null)[]; high: (HTMLImageElement | null)[] },
  quality: FrameQuality,
  cache: FrameCache | undefined,
  signal: AbortSignal,
  cancelledRef: { current: boolean },
  runId: number,
  currentRunId: { current: number },
  onFrame: FramePreloadOptions["onFrame"],
  onProgress: (() => void) | undefined
): Promise<void> {
  const concurrency = normalized.concurrency;
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < indices.length) {
      if (cancelledRef.current || signal.aborted || currentRunId.current !== runId) return;
      const itemIndex = indices[cursor++];
      const slot = itemIndex;
      try {
        const url =
          quality === "low"
            ? normalized.getLowUrl(slot)
            : normalized.getHighUrl(slot);
        const img = await loadImage(url, cache, signal, normalized.crossOrigin);
        if (cancelledRef.current || signal.aborted || currentRunId.current !== runId) return;
        if (quality === "low") refs.low[slot] = img;
        else refs.high[slot] = img;
        if (img && onFrame) onFrame(slot, quality, img);
      } catch {
        // Swallow per-frame errors so one bad frame doesn't kill the batch.
      }
      if (onProgress) onProgress();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, Math.max(1, indices.length)) }, () => worker());
  await Promise.allSettled(workers);
}

export function useFramePreloader(
  manifest: FrameManifestInput,
  options?: FramePreloadOptions
): FramePreloadState {
  const normalized = useMemo(() => normalizeManifest(manifest, options), [manifest]);
  const cache = options?.cache ?? normalized.cache;

  const [lowResFrames, setLowResFrames] = useState<(HTMLImageElement | null)[]>([]);
  const [highResFrames, setHighResFrames] = useState<(HTMLImageElement | null)[]>([]);
  const [firstFrame, setFirstFrame] = useState<HTMLImageElement | null>(null);
  const [loadedLow, setLoadedLow] = useState(0);
  const [loadedHigh, setLoadedHigh] = useState(0);
  const [isFirstFrameReady, setIsFirstFrameReady] = useState(false);
  const [isLowResReady, setIsLowResReady] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cancelledRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const refsRef = useRef<{ low: (HTMLImageElement | null)[]; high: (HTMLImageElement | null)[] }>({
    low: [],
    high: [],
  });
  // Keep latest progress callback without restarting.
  const onProgressRef = useRef(options?.onProgress);
  onProgressRef.current = options?.onProgress;
  const onFrameRef = useRef(options?.onFrame);
  onFrameRef.current = options?.onFrame;

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch {
        // ignore
      }
    }
    setIsLoading(false);
  }, []);

  const total = normalized.count;
  const totalAssets = total > 0 ? total * 2 : 0;

  const restart = useCallback(async () => {
    // Reset state.
    const runId = ++runIdRef.current;
    cancelledRef.current = false;
    const ac = new AbortController();
    abortRef.current = ac;
    setIsLoading(true);
    setError(null);
    setIsComplete(false);
    setIsFirstFrameReady(false);
    setIsLowResReady(false);
    setLoadedLow(0);
    setLoadedHigh(0);
    setFirstFrame(null);

    const lowArr: (HTMLImageElement | null)[] = new Array(total).fill(null);
    const highArr: (HTMLImageElement | null)[] = new Array(total).fill(null);
    refsRef.current = { low: lowArr, high: highArr };

    const updateProgress = () => {
      const low = refsRef.current.low.filter(Boolean).length;
      const high = refsRef.current.high.filter(Boolean).length;
      setLowResFrames([...refsRef.current.low]);
      setHighResFrames([...refsRef.current.high]);
      setLoadedLow(low);
      setLoadedHigh(high);

      let pct = 0;
      if (total > 0) {
        // Two-phase: low-res pass fills 0..50%, high-res pass fills 50..100%.
        const lowProgress = low / total;
        const highProgress = high / total;
        pct = (lowProgress * 0.5 + highProgress * 0.5) * 100;
        if (totalAssets > 0) {
          pct = ((low + high) / totalAssets) * 100;
        }
      }
      if (pct > 100) pct = 100;
      onProgressRef.current?.(pct);
    };

    try {
      // 1. Preload the first frame immediately (low then high).
      if (total > 0) {
        try {
          const firstLow = await loadImage(normalized.getLowUrl(0), cache, ac.signal, normalized.crossOrigin);
          if (runIdRef.current !== runId || cancelledRef.current || ac.signal.aborted) return;
          lowArr[0] = firstLow;
          refsRef.current.low[0] = firstLow;
          if (firstLow) {
            setFirstFrame(firstLow);
            setIsFirstFrameReady(true);
          }
        } catch (err) {
          if (cancelledRef.current || ac.signal.aborted) return;
        }
        try {
          const firstHigh = await loadImage(normalized.getHighUrl(0), cache, ac.signal, normalized.crossOrigin);
          if (runIdRef.current !== runId || cancelledRef.current || ac.signal.aborted) return;
          highArr[0] = firstHigh;
          refsRef.current.high[0] = firstHigh;
          if (firstHigh) {
            setFirstFrame(firstHigh);
            setIsFirstFrameReady(true);
            if (onFrameRef.current) onFrameRef.current(0, "high", firstHigh);
          }
        } catch (err) {
          if (cancelledRef.current || ac.signal.aborted) return;
        }
        updateProgress();
      }

      // 2. Low-res pass for remaining frames.
      if (total > 1 && !cancelledRef.current && !ac.signal.aborted && runIdRef.current === runId) {
        const lowIndices = Array.from({ length: total - 1 }, (_, i) => i + 1);
        await loadIndices(
          lowIndices,
          normalized,
          refsRef.current,
          "low",
          cache,
          ac.signal,
          cancelledRef,
          runId,
          runIdRef,
          onFrameRef.current,
          updateProgress
        );
        if (runIdRef.current !== runId || cancelledRef.current || ac.signal.aborted) return;
        setIsLowResReady(true);
        updateProgress();
      } else if (total === 1) {
        setIsLowResReady(true);
      }

      // 3. High-res pass for remaining frames.
      if (total > 1 && !cancelledRef.current && !ac.signal.aborted && runIdRef.current === runId) {
        const highIndices = Array.from({ length: total - 1 }, (_, i) => i + 1);
        await loadIndices(
          highIndices,
          normalized,
          refsRef.current,
          "high",
          cache,
          cancelledRef.current ? ac.signal : ac.signal,
          cancelledRef,
          runId,
          runIdRef,
          onFrameRef.current,
          updateProgress
        );
        if (runIdRef.current !== runId || cancelledRef.current || ac.signal.aborted) return;
      }

      if (!cancelledRef.current && !ac.signal.aborted && runIdRef.current === runId) {
        const currentLow = refsRef.current.low.filter(Boolean).length;
        const currentHigh = refsRef.current.high.filter(Boolean).length;
        setLoadedLow(currentLow);
        setLoadedHigh(currentHigh);
        setLowResFrames([...refsRef.current.low]);
        setHighResFrames([...refsRef.current.high]);
        const lastHigh = refsRef.current.high[total - 1];
        if (lastHigh) setFirstFrame((prev) => prev ?? lastHigh);
        setIsComplete(true);
        setIsLowResReady(true);
        setIsLoading(false);
        onProgressRef.current?.(100);
      }
    } catch (err) {
      if (cancelledRef.current || ac.signal.aborted) return;
      if (err instanceof Error) setError(err);
      else setError(new Error(String(err)));
      setIsLoading(false);
    }
  }, [normalized, total, cache]);

  // Auto-start on mount / when manifest changes.
  useEffect(() => {
    if (options?.autoStart === false) return;
    void restart();
    return () => {
      cancel();
    };
     
  }, [normalized]);

  const progress = totalAssets > 0
    ? Math.min(100, Math.round(((loadedLow + loadedHigh) / totalAssets) * 100))
    : isComplete
      ? 100
      : 0;

  // Prefer the two-phase percentage during loading for a smoother indicator,
  // but keep it monotonic with loaded counts.
  const frames = highResFrames.length > 0 ? highResFrames : lowResFrames;

  return {
    frames,
    lowResFrames,
    highResFrames,
    firstFrame,
    progress,
    progressRatio: progress / 100,
    loadedLow,
    loadedHigh,
    total,
    totalAssets,
    isLowResReady,
    isFirstFrameReady,
    isComplete,
    isLoading,
    error,
    cancel,
    restart,
  };
}

export default useFramePreloader;
