# HORIZON Design Brief v4 — Overhaul (SA-01)

_Last updated: 2026-11-07 by SA-01 Art Director. Supersedes v3 and docs/DESIGN_DIRECTION v2 for visual decisions. Aligned with in-progress SA-02/SA-03 partial work; final values below are authoritative._

## 1. Concept and character
A premium, editorial AI workstation. Swiss-grid rhythm: generous margins, disciplined typographic hierarchy, asymmetric sections, dense-but-calm data surfaces. Product truth over decoration. One strong idea per screen. No template tropes, no glass blobs, no decorative gradients.

Brand signature: HORIZON Blue on warm ink/paper. Dark and light are both first-class. One brand accent only.

## 2. Non-negotiable anti-AI rules
- No purple-to-blue gradient hero, and no gradient text anywhere.
- No glassmorphism "frosted blobs" or blurred colored halos behind sections. (Frosted surfaces allowed only on the floating chat composer, at low opacity, never as section backgrounds.)
- No emoji used as icons. Lucide icons (1.5px stroke) with text labels.
- No repetitive equal-card 3-up grids as a default section pattern. (Rows, tables, or 2+1 mosaic layouts instead.)
- No Inter, Roboto, Arial, or system default as the primary face. (System fonts are fallback only.)
- No filler copy ("unleash", "elevate", "seamless", "revolutionize", "cutting-edge", "unlock").
- No fake benchmarks, logos, testimonials, or placeholder imagery.
- No two consecutive sections may share the same layout archetype.
- One brand accent only (HORIZON Blue). Status colors are functional, not decorative. The secondary cyan (`#22D3EE`) is no longer a brand accent; reserve any teal/cyan for data differentiation only, and remove gradient button treatments.

## 3. Palette (exact)

### 3.1 Dark theme (default) `html.dark`
| Token | Alias | Hex | Role |
|---|---|---|---|
| `--color-bg` | `--bg` | `#0B0D12` | App background |
| `--color-bg-raised` | `--bg-raised` | `#12151D` | Raised panels / nav / footer |
| `--color-surface` | `--surface` | `#1A1E28` | Card/panel surface |
| `--color-surface-raised` | `--surface-2` | `#222838` | Raised surface |
| `--color-surface-hover` | — | `#1E2433` | Hover surface |
| `--color-border` | `--border` | `#262B3A` | Hairline borders |
| `--color-border-strong` | `--border-strong` | `#353C52` | Focused/selected borders |
| `--color-text` | `--fg` | `#F5F7FA` | Primary text |
| `--color-text-muted` | `--muted` | `#A3AAB9` | Secondary text |
| `--color-text-subtle` | `--subtle` | `#6B7280` | Tertiary/caption text |
| `--color-accent` | `--accent` | `#4F7CF3` | HORIZON Blue — CTAs, focus, active (sole brand accent) |
| `--color-accent-hover` | `--accent-hover` | `#6B90FF` | Accent hover |
| `--color-accent-active` | `--accent-active` | `#3761E0` | Accent pressed |
| `--color-accent-fg` | `--accent-fg` | `#FFFFFF` | Text on accent fill |
| `--color-success` | `--success` | `#22C55E` | Functional success only |
| `--color-warning` | `--warning` | `#F59E0B` | Functional warning only |
| `--color-danger` | `--danger` | `#F87171` | Functional danger only |
| `--color-info` | `--info` | `#60A5FA` | Functional info only |

### 3.2 Light theme `html.light`
| Token | Alias | Hex | Role |
|---|---|---|---|
| `--color-bg` | `--bg` | `#F6F8FC` | App background |
| `--color-bg-raised` | `--bg-raised` | `#FFFFFF` | Raised panels |
| `--color-surface` | `--surface` | `#EEF2F8` | Surface |
| `--color-surface-raised` | `--surface-2` | `#FFFFFF` | Raised surface |
| `--color-surface-hover` | — | `#E4EAF4` | Hover surface |
| `--color-border` | `--border` | `#DCE3EE` | Hairline borders |
| `--color-border-strong` | `--border-strong` | `#C7D2E3` | Focused/selected borders |
| `--color-text` | `--fg` | `#0F172A` | Primary text |
| `--color-text-muted` | `--muted` | `#475569` | Secondary text |
| `--color-text-subtle` | `--subtle` | `#94A3B8` | Tertiary/caption text |
| `--color-accent` | `--accent` | `#3B63D6` | HORIZON Blue (contrast-safe on paper) |
| `--color-accent-hover` | `--accent-hover` | `#4F7CF3` | Accent hover |
| `--color-accent-active` | `--accent-active` | `#2F52B6` | Accent pressed |
| `--color-accent-fg` | `--accent-fg` | `#FFFFFF` | Text on accent fill |
| `--color-success` | `--success` | `#22C55E` | Functional success only |
| `--color-warning` | `--warning` | `#F59E0B` | Functional warning only |
| `--color-danger` | `--danger` | `#F87171` | Functional danger only |
| `--color-info` | `--info` | `#2563EB` | Functional info only |

### 3.3 Color usage rules
- One brand accent only: HORIZON Blue. Every primary action uses it. Secondary actions use ink/border.
- Accent may appear as: primary CTA fill, focus ring, active nav indicator, one key data highlight per viewport, selected chip. Never full-bleed backgrounds, never gradients, never large halos.
- Do not stack accent with any other saturated hue in the same component.
- Dark and light tokens must remain in sync: same hue family, adjusted lightness for contrast. Never hard-code hex in components; use tokens.
- Remove `--accent-2` / `--accent-ai` (cyan) from new work; existing usages must migrate in SA-03.
- Minimum contrast: body text 4.5:1, large text 3:1, focus indicators 3:1 against adjacent background.

## 4. Typography

### 4.1 Families (load via next/font)
- **Display**: `Space Grotesk` — weights 500, 600. CSS var `--font-display`.
- **Body / UI**: `Manrope` — weights 400, 500, 600, 700. CSS var `--font-body`.
- **Mono / data**: `JetBrains Mono` — weights 400, 500. CSS var `--font-mono`.
- Generic system fonts are fallback only (`ui-sans-serif` / `ui-monospace`).
- **Removed as primary**: Inter, Roboto, Arial, Geist (as primary), Segoe UI.

### 4.2 Type roles
| Role | Font | Weight | Size desktop / mobile | Line-height | Tracking | Usage |
|---|---|---|---|---|---|---|
| Display XL (hero H1) | Space Grotesk | 600 | 48px / 32px | 1.00 | -0.02em | One per page maximum |
| Display L (section H1) | Space Grotesk | 600 | 40px / 30px | 1.05 | -0.02em | Major section headings |
| Display M (H2) | Space Grotesk | 600 | 32px / 24px | 1.05 | -0.02em | Subsection headings |
| Heading L (H3) | Space Grotesk | 600 | 24px / 20px | 1.15 | -0.01em | Card/panel titles |
| Heading M (H4) | Space Grotesk | 500 | 20px / 18px | 1.20 | 0 | Group labels |
| Heading S (H5/H6) | Space Grotesk | 500 | 16-18px | 1.25 | 0 | List item titles |
| Body L | Manrope | 400 | 18px / 16px | 1.70 / 1.60 | 0 | Long-form lede, max 68ch |
| Body M | Manrope | 400 | 16px | 1.55 | 0 | Default body |
| Body S | Manrope | 400 | 14px | 1.50 | 0 | Secondary descriptions |
| Caption / Label | Manrope | 500 | 12px | 1.30 | 0.08-0.12em uppercase | Metadata, status, section labels |
| Mono Data | JetBrains Mono | 400 | 14px / 13px | 1.45 | 0 | Code, metrics, prices, IDs |
| Mono Code | JetBrains Mono | 400 | 13px | 1.50 | 0 | Code blocks |

### 4.3 Typography rules
- Display face is Space Grotesk; body is Manrope. Never default the body to system fonts except as fallback.
- Headlines may include at most one accent-colored phrase, set in solid blue, never gradient.
- Body paragraphs capped at 68ch (`--measure-prose`).
- Use `font-variant-numeric: tabular-nums` on all numbers in tables, pricing, and token counts.
- Section labels use uppercase tracked captions with a leading 1px rule.

## 5. Spacing scale
Base unit 4px. Authoritative tokens:
- `--space-1` = 4px
- `--space-2` = 8px
- `--space-3` = 12px
- `--space-4` = 16px
- `--space-5` = 24px
- `--space-6` = 32px
- `--space-7` = 48px
- `--space-8` = 64px
- `--space-9` = 96px
- `--space-10` = 128px

Named roles:
- `--space-section` = 96px
- `--space-container-x` = 24px
- `--max-content` = 1280px
- `--max-prose` = 68ch
- `--measure-narrow` = 48ch
- `--measure-text` = 1120px
- `--measure-content` = 1280px

Internal component gaps: 8 / 12 / 16 / 24. Between components in a section: 24 / 32 / 48. Between sections: see section rhythm.

## 6. Radius, borders, elevation
- Radius: `--radius-xs` 4, `--radius-sm` 6, `--radius-md` 8, `--radius-lg` 12, `--radius-xl` 16, `--radius-2xl` 20, `--radius-pill` 999.
  - Controls (buttons, inputs, selects): 6px.
  - Cards/panels: 12px.
  - Dialogs/drawers/composer: 16px.
  - Badges/chips/pills: 999px.
- Borders: 1px hairlines using `--border`; strong state `--border-strong`. No 2px borders except focus rings.
- Elevation (no neon glows):
  - Dark: `--shadow-xs` 0 1px 2px rgba(0,0,0,.35); `--shadow-md` 0 8px 24px rgba(0,0,0,.38); `--shadow-lg` 0 16px 48px rgba(0,0,0,.48).
  - Light: `--shadow-xs` 0 1px 2px rgba(15,23,42,.06); `--shadow-md` 0 8px 24px rgba(15,23,42,.10); `--shadow-lg` 0 16px 48px rgba(15,23,42,.14).
- Glass is not a default surface treatment. Frosted styles, if used at all, only on the chat composer and floating panels, at the established low opacity.
- Hover on interactive surfaces deepens border only; no lift/translate as default.
- Focus ring: 3px `--shadow-focus` (rgba(79,124,243,.36) dark / .24 light), or 2px solid accent with 2px offset.

## 7. Motion
- Durations: micro 100ms, control 180ms, panel 240ms, page 320ms.
- Easing: out `cubic-bezier(0.25, 1, 0.5, 1)`; in `cubic-bezier(0.5, 0, 0.75, 1)`; in-out `cubic-bezier(0.45, 0, 0.55, 1)`; emphasized `cubic-bezier(0.22, 1, 0.36, 1)`.
- Animate `transform` + `opacity` only. Never animate color/size/box-shadow except instantaneous state changes.
- Scroll reveal: translate 16px, opacity 0→1, 240ms, once per element, never repeat on scroll up.
- Reduced motion: disable reveals; transform none; durations to .01ms; follow `prefers-reduced-motion`.
- Chat streaming: reserve stable min-height for assistant messages; avoid layout shift.
- No parallax. No infinite spinners for primary states; use skeleton shapes.

## 8. Grid and container widths
- Grid: 12 columns. Desktop gap 24px, tablet (768–1023) 20px, mobile (≤640) 16px.
- Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1440.
- Containers (max-width, centered, with horizontal padding = gutter):
  - `container-full`: 100% with 24px (desktop) / 20px (tablet) / 16px (mobile) side padding.
  - `container-xl`: 1280px
  - `container-lg`: 1120px
  - `container-md`: 960px
  - `container-sm`: 760px (forms, narrow editorial)
  - `container-xs`: 640px (modals, drawers content)
- Text measure: 68ch (`--measure-prose`) inside `container-sm`/`md`.
- Asymmetric spans: prefer `7/5`, `8/4`, `5/7`, `9/3`, `4/8`. Reserve `6/6` for genuine pairs (pricing tiers, before/after).
- Never default to three equal columns. If listing 3+ items, use stacked rows, 2+1 mosaic, or a ranked table.

## 9. Section rhythm
Vertical padding (top / bottom) for a section:
- Hero: 160 / 96 (desktop), 96 / 64 (mobile)
- Editorial XL: 128 / 128
- Section L: 96 / 96
- Section M: 80 / 80
- Section S (dense data band): 48 / 48
- CTA band: 64 / 64, max-width `container-sm`
- Footer: 64 / 48

Rules:
- Adjacent sections must differ by at least one band size or layout archetype.
- Insert a 1px horizontal rule (not a colored strip) between sections of equal density.
- First section after nav is always the Hero archetype (full-bleed, 7/5 split, no equal card grid).

## 10. Component visual language
- **Navigation**: wordmark "HORIZON" in Display (Space Grotesk) weight 600, tracked -0.02em. Links in Body M muted → fg on hover; active link shows a 2px accent underline offset 6px. Mobile: full-height solid drawer, no blur.
- **Hero**: display headline with one solid-blue phrase; body lede max ~44ch; primary CTA solid blue with white text; secondary bare link with arrow. Background is tonal gradient bg→raised only. No hero imagery required; if used, a single product screenshot framed by a 1px border, radius xl.
- **Buttons**: primary `--accent` fill / white text; secondary transparent with `--border` and fg text; tertiary text button with underline on hover; danger text button in `--danger`. Min height 40, horizontal padding 16 (md), radius 6. No gradient fills, no drop shadows.
- **Inputs**: `--surface-2`/recessed fill, 1px `--border`, radius 6, vertical padding 12, label above (caption role), helper text below. Focus switches border to `--accent` plus focus ring.
- **Cards/panels**: `--surface` fill, 1px `--border`, radius 12, padding 24. Hover: border becomes `--border-strong`. No default lift, no glass, no glow shadow beyond `shadow-1`.
- **Tables/data**: plain rows separated by 1px rules; sticky header with caption label; mono numerals. Never wrap rows in cards.
- **Badges/chips**: outlined, caption role, radius pill, 1px border; color variants only for status. Brand accent chip allowed for one primary "New"/status label per screen.
- **Chat composer**: fixed bottom, solid surface with 1px border and shadow, radius 16. Send button is a 36px square (radius 6) in accent. No blur; no glow.
- **Empty/loading states**: skeleton bars sized to real content; empty state is one headline (Display M) + one sentence + one action. No spinner-only states.
- **Dividers**: 1px `--border`; section-level dividers full width.
- **Media**: thumbnails radius 8; editorial/full-bleed imagery radius 0. Never use rounded gradient stickers.

## 11. Layout archetypes (approved)
- **Hero (A)**: full-bleed; 7/5 split; headline + lede + CTAs left; model/data index right.
- **Asymmetric Proof (B)**: 8/4; statement left, supporting metric/index right.
- **Alternating Feature (C)**: 5/7 then 7/5 across consecutive bands; media radius 0 or 8.
- **Dense Data Table (D)**: full-width rows, no cards.
- **Editorial Long-form (E)**: `container-sm`, display H2 followed by body ≤68ch.
- **Narrow CTA Band (F)**: `container-sm`, centered, one button.
- **Footer (G)**: 4-column rule-based grid + bottom legal row.

## 12. Accessibility
- Focus-visible always; never remove outlines; use the focus ring defined in §6.
- Reduced motion respected globally.
- Do not rely on color alone (badges include text; status has icon + label).
- Skip link to main content.
- Keyboard operable dropdowns/drawers; trap focus in modals.

## 13. File targets (do not edit in this SA)
- SA-02 Typography: `src/app/layout.tsx`, `src/app/globals.css`, `src/styles/typography.css`, components using `font-*`.
- SA-03 Design Tokens: `src/app/globals.css` (`:root`, `html.light`, `@theme`), component classNames referencing tokens.
- SA-04 Logo Prep: `public/brand/`, `src/components/Nav.tsx`, `src/components/Footer.tsx`.
- Wave B–D: consume tokens and grid above; do not invent new colors/fonts/spacing.
- SA-21 Layout: page shells; use archetypes in §11. Remove glass/glow styles from the default page composition.
- SA-23 Accessibility: focus rings and reduced motion from §6/§7.

## 14. Handoff
Entry recorded in `/HANDOFF.md` (fonts and colors). Font triad: Space Grotesk / Manrope / JetBrains Mono. Single brand accent: HORIZON Blue (`#4F7CF3` dark, `#3B63D6` light). Full token tables and rules: §3–§10.
