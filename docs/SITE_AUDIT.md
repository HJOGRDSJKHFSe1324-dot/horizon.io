# HORIZON Site Audit

## Stack
- Next.js 15.5.29 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4
- Prisma 6 + PostgreSQL
- NextAuth v5 (credentials + optional Google OAuth)
- Stripe GBP recurring billing
- Local AI gateway: Rust/Axum (was Python; rebuilt)
- Basis UI fonts: Geist + Plus Jakarta Sans + Inter
- Icons: lucide-react

## Pages
Public: `/`, `/models`, `/chat`, `/pricing`, `/benchmarks`, `/tools`, `/login`, `/register`, `/reset-password`, `/verify-email`, `/privacy`, `/terms`, `/account`, `/dashboard`
Admin: `/admin` (tabs: Overview, Users, Subscriptions, Payments, Conversions, Withdrawals, Bans, Models, Server, Benchmarks, Settings)

## Components
- `Nav` (responsive mobile menu, theme toggle, session handling)
- `Dropdown` (animated, up/down placement)
- `ThemeProvider` (dark/light)
- Shared page shells are duplicated rather than centralized.

## Design tokens currently used
- `--bg`, `--fg`, `--muted`, `--surface`, `--surface-2`, `--border`, `--accent`, `--accent-2`
- radius: mixed 6px / 8px / 12px / 14px / pills
- spacing: mostly Tailwind scale (4px base)
- shadows: dark-heavy; light mode supported via CSS overrides
- core brand accent: cyan -> blue gradient
- secondary: violet accents in hero

## Performance baseline (observed)
- Build compiles successfully: 54/55 routes.
- Shared client bundle ~126kB first-load.
- Chat page ~95KB route chunk due React Markdown + Framer Motion.
- Admin ~9.7KB route chunk.
- Lighthouse was not run natively in this container; use Chrome Lighthouse on the deployed/public URL for exact.

## Accessibility baseline
- Keyboard, ARIA, contrast, `role=alert/status`, and focus rings were improved across major pages.
- Remaining gaps: full WCAG audit not completed; several tables are not fully screen-reader polished.

## Known defects (ranked)
1. No automated test suite (integration/e2e).
2. `next.config.ts` intentionally ignores TypeScript/ESLint build errors (release cleanup item).
3. Stripe checkout returns `503` until real keys are configured.
4. Local AI gateway still runs on the user's PC; site is nonfunctional for AI if PC/tunnel is down.
5. No fully managed cloud compute for chat "sandbox" features.
6. Benchmark scores are real but based on a limited test set.
7. Some admin actions report generic success/error messages.
8. Dark/light coverage is CSS-class based; some components only partially themed.

## Anti-AI look audit focus
- Current home page still leans on a default three-column card grid and blue/cyan gradients; refine to a more original, product-led layout.
- Remove filler copy such as “Intelligence Beyond Limits.”? Brand says keep; retain exactly as required.
- Improve section rhythm, asymmetry, varied whitespace, and distinctive typographic hierarchy.
- Refine focus/hover/motion and empty/loading states per component.