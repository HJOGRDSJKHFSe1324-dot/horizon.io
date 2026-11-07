# SA-13 Best Models UI Handoff

## Scope completed
- Created `src/components/BestModelsShowcase.tsx`.
- Personality-driven asymmetric showcase: one featured model anchor plus a vertical index of supporting models (no equal 3-card grid).
- Metrics from `/api/benchmarks` (tokens/sec, latency, overall) and strengths from model content/map, with safe fallback data from `site-copy`.
- CTA links to model chat routes; view-all link to `/models`.
- Composed into `src/app/page.tsx` (home models section) and `src/app/models/page.tsx`.

## Notes
- Component supports `models`, `results`, `limit`, labels, and `chatHref` props; self-fetches when props are absent.
- Copy uses `siteCopy` labels only.
- Build and `tsc --noEmit` pass.

## Changed files
- src/components/BestModelsShowcase.tsx
- src/app/page.tsx
- src/app/models/page.tsx
- HANDOFF_SA-13.md