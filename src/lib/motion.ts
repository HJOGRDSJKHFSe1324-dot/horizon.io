"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
/* ==========================================================================
   HORIZON motion + responsive helpers (SA-10)
   - Reduced-motion aware (prefers-reduced-motion)
   - Responsive breakpoints aligned with DESIGN_BRIEF.md §8
   - Touch-scroll safe helpers for canvas/spin fallbacks
   ========================================================================== */

export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export const MOTION_DURATIONS = {
  micro: 100,
  control: 180,
  panel: 240,
  page: 320,
} as const;

export const MOTION_EASINGS = {
  out: "cubic-bezier(0.25, 1, 0.5, 1)",
  in: "cubic-bezier(0.5, 0, 0.75, 1)",
  inOut: "cubic-bezier(0.45, 0, 0.55, 1)",
  emphasized: "cubic-bezier(0.22, 1, 0.36, 1)",
} as const;

export const MEDIA_QUERIES = {
  reducedMotion: "(prefers-reduced-motion: reduce)",
  coarsePointer: "(pointer: coarse)",
  finePointer: "(pointer: fine)",
  hover: "(hover: hover)",
  anyHover: "(any-hover: hover)",
  portrait: "(orientation: portrait)",
  landscape: "(orientation: landscape)",
  dark: "(prefers-color-scheme: dark)",
  light: "(prefers-color-scheme: light)",
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1440px)",
} as const;

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getViewportWidth(): number {
  if (!isBrowser()) return 0;
  return window.innerWidth || document.documentElement.clientWidth || 0;
}

export function getViewportHeight(): number {
  if (!isBrowser()) return 0;
  return window.innerHeight || document.documentElement.clientHeight || 0;
}

export function getBreakpoint(width: number = getViewportWidth()): Breakpoint {
  if (width >= BREAKPOINTS["2xl"]) return "2xl";
  if (width >= BREAKPOINTS.xl) return "xl";
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";
  return "xs";
}

export function isSmallScreen(
  width: number = getViewportWidth(),
  maxBreakpoint: number = BREAKPOINTS.md,
): boolean {
  return width > 0 ? width < maxBreakpoint : true; // SSR defaults to mobile-first
}

export function isDesktop(width: number = getViewportWidth()): boolean {
  return width >= BREAKPOINTS.lg;
}

export function useMediaQuery(query: string, initial: boolean = false): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (!isBrowser()) return initial;
    try {
      return window.matchMedia(query).matches;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    let mql: MediaQueryList | null = null;
    try {
      mql = window.matchMedia(query);
    } catch {
      setMatches(initial);
      return;
    }
    const update = (event?: MediaQueryListEvent) => {
      setMatches(event ? event.matches : mql!.matches);
    };
    update();
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", update);
    } else if (typeof (mql as any).addListener === "function") {
      (mql as any).addListener(update);
    }
    return () => {
      if (!mql) return;
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", update);
      } else if (typeof (mql as any).removeListener === "function") {
        (mql as any).removeListener(update);
      }
    };
  }, [query, initial]);

  return matches;
}

export function useReducedMotion(initial: boolean = false): boolean {
  return useMediaQuery(MEDIA_QUERIES.reducedMotion, initial);
}

/** Alias used by some consumers. */
export const usePrefersReducedMotion = useReducedMotion;

export function useCoarsePointer(): boolean {
  return useMediaQuery(MEDIA_QUERIES.coarsePointer, false);
}

export function useHoverCapable(): boolean {
  return useMediaQuery(MEDIA_QUERIES.hover, false);
}

export function useTouchDevice(): boolean {
  const coarse = useCoarsePointer();
  const [touch, setTouch] = useState<boolean>(() => {
    if (!isBrowser()) return false;
    return navigator.maxTouchPoints > 0;
  });
  useEffect(() => {
    setTouch(navigator.maxTouchPoints > 0 || coarse);
  }, [coarse]);
  return touch || coarse;
}

export function useViewportSize(): { width: number; height: number } {
  const [size, setSize] = useState<{ width: number; height: number }>(() => ({
    width: isBrowser() ? getViewportWidth() : 0,
    height: isBrowser() ? getViewportHeight() : 0,
  }));

  useEffect(() => {
    const update = () => setSize({ width: getViewportWidth(), height: getViewportHeight() });
    update();
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("orientationchange", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return size;
}

export function useBreakpoint(): Breakpoint {
  const { width } = useViewportSize();
  return isBrowser() ? getBreakpoint(width) : "xs";
}

export function useIsMobile(threshold: number = BREAKPOINTS.md): boolean {
  const { width } = useViewportSize();
  // mobile-first while width is unknown (SSR)
  if (!isBrowser()) return true;
  return width < threshold;
}

export function useIsTablet(): boolean {
  const { width } = useViewportSize();
  if (!isBrowser()) return false;
  return width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg;
}

export function useIsDesktop(threshold: number = BREAKPOINTS.lg): boolean {
  const { width } = useViewportSize();
  if (!isBrowser()) return false;
  return width >= threshold;
}

export interface HeavyCanvasDecision {
  useCanvas: boolean;
  usePoster: boolean;
  reason: "reduced-motion" | "small-screen" | "touch" | "ok";
}

export interface ShouldUseCanvasOptions {
  mobileBreakpoint?: number;
  allowHeavyOnTouch?: boolean;
}

export function shouldUseHeavyCanvas(opts?: {
  reducedMotion?: boolean;
  isSmallScreen?: boolean;
  isTouch?: boolean;
  allowHeavyOnTouch?: boolean;
}): HeavyCanvasDecision {
  if (opts?.reducedMotion) {
    return { useCanvas: false, usePoster: true, reason: "reduced-motion" };
  }
  if (opts?.isSmallScreen) {
    return { useCanvas: false, usePoster: true, reason: "small-screen" };
  }
  if (opts?.isTouch && !opts?.allowHeavyOnTouch) {
    // Touch devices keep scrolling smooth by avoiding heavy canvas work.
    return { useCanvas: false, usePoster: true, reason: "touch" };
  }
  return { useCanvas: true, usePoster: false, reason: "ok" };
}

export function useShouldUsePosterFrame(options?: ShouldUseCanvasOptions): HeavyCanvasDecision {
  const reducedMotion = useReducedMotion();
  const mobileBreakpoint = options?.mobileBreakpoint ?? BREAKPOINTS.md;
  const isSmall = useIsMobile(mobileBreakpoint);
  const isTouch = useTouchDevice();
  return shouldUseHeavyCanvas({
    reducedMotion,
    isSmallScreen: isSmall,
    isTouch,
    allowHeavyOnTouch: options?.allowHeavyOnTouch,
  });
}

/** Alias names for convenience / forward compatibility. */
export const useShouldRenderPoster = useShouldUsePosterFrame;
export const useSpinFallback = useShouldUsePosterFrame;
export const useHeavyCanvasDecision = useShouldUsePosterFrame;

export function getPosterFrameIndex(progress: number = 0, totalFrames: number = 1): number {
  if (totalFrames <= 1) return 0;
  const clamped = Math.min(1, Math.max(0, progress));
  return Math.round(clamped * (totalFrames - 1));
}

/* Touch scrolling helpers: apply to scroll containers wrapping heavy visuals. */
export const TOUCH_SCROLL_STYLE: CSSProperties = {
  touchAction: "pan-y",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
};

export function touchScrollProps(): { style: CSSProperties } {
  return { style: { ...TOUCH_SCROLL_STYLE } };
}

export function useTouchScroll(): { style: CSSProperties; onTouchMove: (e: any) => void } {
  return {
    style: { ...TOUCH_SCROLL_STYLE },
    onTouchMove: () => {
      /* allow native scroll; ensure we never preventDefault */
    },
  };
}


// no-op helper retained for import safety
export function motionSafeDuration(ms: number, reduced: boolean): number {
  return reduced ? 0 : ms;
}

// Remove stray invalid placeholder line if present
export const MOTION_CLASSES = {
  fadeIn: "motion-fade",
  slideUp: "motion-slide-up",
  reducedDisable: "motion-reduced-disable",
} as const;
