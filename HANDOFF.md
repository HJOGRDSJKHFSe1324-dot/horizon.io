# HORIZON HANDOFF LOG

## SA-01 — Fonts & Colors (2026-11-07)

### Fonts
- Display (headlines): **Space Grotesk** (weights 500, 600) — CSS var `--font-display`
- Body/UI (default): **Manrope** (weights 400, 500, 600, 700) — CSS var `--font-body`
- Mono/data/code: **JetBrains Mono** (weights 400, 500) — CSS var `--font-mono`
- Removed as primary: Inter, Roboto, Arial, Geist (primary), Segoe UI. System fonts are fallback only.
- Load via `next/font/google`; subsets latin; `display: swap`.

### Colors
- Single brand accent: **HORIZON Blue**
  - Dark theme: `#4F7CF3` (hover `#6B90FF`, active `#3761E0`, fg `#FFFFFF`)
  - Light theme: `#3B63D6` (hover `#4F7CF3`, active `#2F52B6`, fg `#FFFFFF`)
- Dark neutrals: bg `#0B0D12`, raised `#12151D`, surface `#1A1E28`, surface-2 `#222838`, hover `#1E2433`, border `#262B3A`, strong `#353C52`, text `#F5F7FA`, muted `#A3AAB9`, subtle `#6B7280`
- Light neutrals: bg `#F6F8FC`, raised `#FFFFFF`, surface `#EEF2F8`, surface-2 `#FFFFFF`, hover `#E4EAF4`, border `#DCE3EE`, strong `#C7D2E3`, text `#0F172A`, muted `#475569`, subtle `#94A3B8`
- Functional only: success `#22C55E`, warning `#F59E0B`, danger `#F87171`, info `#60A5FA` (light `#2563EB`)
- Removed as brand accent: cyan `#22D3EE` / teal `#0891B2`. Migrate existing cyan button/gradient usages; no gradient fills.
- No glassmorphism blobs or glowing shadows as default surface treatment.

### Notes
- Full token tables, type roles, spacing/radius/motion, grid, and component rules: `DESIGN_BRIEF.md`
- Layout archetypes and SA file targets: `.opencode/ART_DIRECTION.md`
- Owners next: SA-02 (Typography, already partially aligned), SA-03 (Design Tokens, must remove cyan and glass/glow defaults). Do not introduce colors/fonts outside this entry.
