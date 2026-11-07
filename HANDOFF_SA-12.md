# SA-12 Models Data Layer Handoff

## Scope completed
- Created `src/data/models.ts` with typed model metadata (`name`, `slug`, `tier`, `strengths`, `weaknesses`, `benchmarks`).
- Sources used only: `prisma/seed.ts`, `src/content/site-copy.ts`, Modelfile `OTHER_MODELS` notes, and the HORIZON database `benchmark_results` table.
- Benchmarks backed by real measured published runs are marked `status: "verified"` with averages (Zenith-1.1 52.94%, Halo 1.5 47.06%, Halo 2.5 82.35%).
- Models without published runs (Nova 5.2, Nova 5.4 Ultra) have `null` numeric fields and `status: "unverified"`.
- No numbers were invented from `MMLU_PRO_SCORES.png` (image not parsed).
- Updated `/api/models` to merge static fields (`strengths`, `weaknesses`, `benchmarks`, `parameters`) while keeping the existing response shape (additive only).

## Changed files
- src/data/models.ts
- src/app/api/models/route.ts
- HANDOFF_SA-12.md

## Validation
- Target: `npx tsc --noEmit`
