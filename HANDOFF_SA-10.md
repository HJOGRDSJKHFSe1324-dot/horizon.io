# SA-10 Mobile / Reduced Motion Handoff

## Files created
- `src/lib/motion.ts` - reduced-motion hook `useReducedMotion` (alias `usePrefersReducedMotion`), responsive helpers (`useMediaQuery`, `useViewportSize`, `useBreakpoint`, `useIsMobile`, `useIsTablet`, `useIsDesktop`, `useTouchDevice`, `useCoarsePointer`), constants (`BREAKPOINTS`, `MEDIA_QUERIES`, `MOTION_DURATIONS`, `MOTION_EASINGS`), decision helpers (`shouldUseHeavyCanvas`, `useShouldUsePosterFrame` + aliases), touch-scroll helpers (`TOUCH_SCROLL_STYLE`, `touchScrollProps`, `useTouchScroll`), and utilities (`getPosterFrameIndex`, `motionSafeDuration`).
- `src/components/SpinPoster.tsx` - lightweight static poster fallback component (`SpinPoster` / default export). Supports `src`, `frames` + `frame`, dimensions, priority, etc.

## Usage notes for LogoSpinScroll (SA-06/07)
- Import `useShouldUsePosterFrame` (or `useSpinFallback`) and conditionally render `<SpinPoster />` when `usePoster` is true; otherwise render heavy canvas.
- Gate rendering on `!useCanvas` keeps mobile / touch / reduced-motion on the poster.
- Wrap the spinning container with `touchScrollProps()` (or use `useTouchScroll()`) so native touch scrolling is not blocked by canvas event handlers (`touch-action: pan-y`, `overscroll-behavior: contain`).
- `SpinPoster` is dependency-free and SSR-safe; use `priority` for above-the-fold frames.

## Mobile-first defaults
- `useIsMobile` returns true on SSR to avoid flashing heavy canvas.
- `isSmallScreen` defaults to true when width is unknown.

## Commit
SA-10: mobile and reduced-motion fallback
