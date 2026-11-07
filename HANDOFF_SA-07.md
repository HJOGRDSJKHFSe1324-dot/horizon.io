# SA-07 Scroll Engine Handoff

## Scope completed
- Created `src/components/LogoSpinScroll.tsx`: scroll-driven, pinned (≈450vh) logo frame-sequence engine.
- Canvas renderer with DPR scaling, `requestAnimationFrame` smoothing (lerp on frame index), IntersectionObserver lazy loading and preloading.
- Manifest/frame base path configurable; static fallback when reduced motion / first paint.
- Exported helpers: `preloadLogoFrames`, `useReducedMotion`, plus types.

## Props / API
- `manifest`: `LogoSpinManifest | LogoSpinFrameInput[] | string | null`. Strings are fetched as JSON when in view; `null` disables loading/default path.
- `frameBasePath`: base path/URL for relative frame entries (overrides manifest fields).
- `frames`: direct list of frame URLs (precedence over manifest).
- `heightVh` (default 450), `smoothing` (default 0.12), `staticFrame` (`first|last|middle|number`, default last).
- `reducedMotion`, `autoDetectReducedMotion` (default true).
- `preloadConcurrency` (default 6), `loader`, `fallback`, `ariaLabel`, `className`, `onProgress`, `onFrameChange`.

## Manifest shape supported
- Array of strings or `{src|url|path|file|name}` entries.
- Or object with `frames|images|sequence` plus optional `basePath|baseUrl|frameBasePath|dir`.

## Motion / a11y
- Defaults to static on first paint and when `prefers-reduced-motion` matches; SA-10 can pass `reducedMotion` and/or use the exported `useReducedMotion` hook.
- Canvas has `role="img"` and accessible label; loader uses `aria-live`.

## Notes for next agents
- Default manifest path is `/frames/manifest.json` (SA-06 frames + SA-06 manifest).
- Uses SA-10 motion helpers for poster/canvas decision and `SpinPoster` fallback.
- Uses `src/lib/frameLoader.ts` (`useFramePreloader`) for preloading/caching.
- Not wired into any page; integrate in SA-08/SA-11 as needed.
- Type-check: `npx tsc --noEmit`.

## Changed files
- src/components/LogoSpinScroll.tsx
- HANDOFF_SA-07.md