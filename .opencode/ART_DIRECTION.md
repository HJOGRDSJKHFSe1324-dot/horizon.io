# HORIZON Art Direction (SA-01)

_Source of truth for layout, grid, and visual rhythm. Read with DESIGN_BRIEF.md before editing any UI. Do not edit application code from this artifact alone—implement against it._

## 1. Direction in one line
Editorial AI workstation: warm ink/paper, Space Grotesk display, Manrope body, one blue accent, asymmetric 12-column grid, generous whitespace, calm data surfaces.

## 2. Grid system (ASCII)
```
Breakpoints: sm 640, md 768, lg 1024, xl 1280, 2xl 1440
Columns: 12
Gaps:     24px (>=1024), 20px (768-1023), 16px (<=640)

+-- container-xl / measure-content (1280) ----------------------+
|  1  2  3  4  5  6  7  8  9  10 11 12  (24px gutter)         |
+--------------------------------------------------------------+
```

Container max-widths:
- full: 100% with 24 (desktop) / 20 (tablet) / 16 (mobile) side padding
- xl: 1280, lg: 1120, md: 960, sm: 760, xs: 640

Spacing tokens:
`space-1 4, space-2 8, space-3 12, space-4 16, space-5 24, space-6 32, space-7 48, space-8 64, space-9 96, space-10 128`

Preferred asymmetric spans:
```
7 / 5   hero + index
8 / 4   proof + metric
5 / 7   alternating feature (media right)
9 / 3   statement + sidebar
4 / 8   sidebar + statement
6 / 6   only for genuine pairs
```

## 3. Page archetypes and ASCII layouts

### A. Home
```
[ Nav: wordmark left | links + theme right, 64h, hairline bottom ]
+---------------------------------------------------------------+
| HERO (full-bleed, 160/96)                                     |
| +-----------------------------+  +-------------------------+   |
| | Display XL headline         |  | Vertical index card     |   |
| | (7 cols) one blue phrase    |  | 3 model rows            |   |
| | Body L lede max 44ch        |  | each: name + mono meta  |   |
| | [Primary] [Explore]         |  | staggered, no equal grid|   |
| +-----------------------------+  +-------------------------+   |
+---------------------------------------------------------------+
| PROOF (Section M, 8/4)                                         |
| +---------------------------------+  +-------------------+     |
| | Display M statement             |  | metric in mono     |     |
| | 2 sentences max                 |  | supporting note    |     |
| +---------------------------------+  +-------------------+     |
+---------------------------------------------------------------+
| FEATURE (Section L, 5/7)                                       |
| [image radius 8, spans 5]  [Heading + body, spans 7]           |
+---------------------------------------------------------------+
| FEATURE 2 (Section L, 7/5, alternate direction)                |
| [Heading + body, spans 7] [image radius 0, spans 5]            |
+---------------------------------------------------------------+
| DATA TABLE (Section S, full width, rule-separated rows)        |
+---------------------------------------------------------------+
| CTA BAND (Section M, container-sm, centered)                   |
+---------------------------------------------------------------+
| FOOTER (G)                                                     |
```

### B. Models listing
```
[ Nav ]
+---------------------------------------------------------------+
| Index header (container-lg): caption + Display L + lede        |
+---------------------------------------------------------------+
| Rank | Model name (display) | Capability line | Access | Arrow |
| ---- | ------------------- | --------------- | ------ | -----  |
| 01   | Zenith-1.1          | ...             | Free   | ->     |
| 02   | ...                                                  |
| (full-width rows, 1px rules, no card boxes)                    |
+---------------------------------------------------------------+
```

### C. Chat
```
[ Nav compact ]
+---------------------------------------------------------------+
| container-md conversation stream                               |
|   user   right-aligned bubble (surface-2, radius 12)           |
|   assistant left-aligned plain text + markdown                 |
|         with stable min-height                                 |
+---------------------------------------------------------------+
| Fixed composer (solid surface-2/recessed fill, border, shadow)    |
| textarea + square send button accent, radius 16 wrapper        |
+---------------------------------------------------------------+
```

### D. Pricing
```
[ Nav ]
+---------------------------------------------------------------+
| Header (container-sm, centered, narrow)                        |
+---------------------------------------------------------------+
| [Free] [Pro]   2-up equal pair (6/6 only)                      |
| feature rows as rules, not cards                                |
+---------------------------------------------------------------+
| FAQ (container-sm, rule-separated accordion)                  |
+---------------------------------------------------------------+
```

### E. Benchmarks / Tools / Admin shells
- Public: Section L header, dense data table D for rows, never a card grid.
- Admin: left rail navigation (240px fixed) + content area with tables and forms; dialogs radius xl.
- Tools: 2-column master (picker left 4, result right 8); mobile stacks with result first.

## 4. Visual language notes
- No `glass` surface as a default section background; composer/floating panels only.
- No glow shadows on primary buttons or section wraps.
- Home never contains a 3-up equal feature card grid. Lists use rows, 2+1 mosaic, or tables.
- Section labels format: `01 / PLATFORM` (caption tracked, uppercase) followed by a 1px rule to the right.
- Alternating sections change at least one of: density, alignment, or span pattern.
- Touch targets minimum 40px for interactive controls.
- Horizontal rules are 1px `--border`, full section width, no color.

## 5. File targets for other SAs
| SA | Files | Responsibility |
|---|---|---|
| SA-02 Typography | `src/app/layout.tsx`, `src/app/globals.css`, `src/styles/typography.css` | Fonts Space Grotesk / Manrope / JetBrains Mono; scale `--text-12..--text-48` |
| SA-03 Design Tokens | `src/app/globals.css` | Apply exact palette/spacing/radius/shadow/motion tokens; remove glass/glow defaults and the cyan second accent |
| SA-04 Logo Prep | `public/brand/`, `Nav.tsx`, `Footer.tsx` | Wordmark uses Display; remove gradient badge treatments |
| SA-05 Copywriter | `src/content/site-copy.ts`, pages | Replace filler; concrete, short |
| SA-06 Frame Generator | hero/media assets | Respect radius/motion; no blob imagery |
| SA-07 Scroll Engine | reveal classes | 16px translate, once, reduced-motion |
| SA-08 Hero Text | hero section | Archetype A, solid blue phrase only |
| SA-12/13/14 Models UI | models pages | Row/table patterns, no 3-up equal grid |
| SA-17/18/19 Chat | chat components | Solid composer, stable min-heights, no glow |
| SA-21 Layout | page shells | Archetypes A–G |
| SA-22 Responsive | all components | breakpoints/container widths above |
| SA-23 Accessibility | global styles | focus rings, reduced-motion |

## 6. Handoff reference
- Fonts/colors handoff: `/HANDOFF.md` (section "SA-01 — Fonts & Colors").
- Full token tables and component rules: `/DESIGN_BRIEF.md`.

## 7. Do-not-do list
- No glassmorphism blobs as default surfaces.
- No purple/blue gradient hero or gradient text.
- No emoji icons.
- No repetitive equal 3-up grid.
- No Inter/Roboto/Arial/system default primary look.
- No second brand accent (HORIZON Blue only).
- No cyan gradient buttons; remove existing gradient CTA styling.
- No parallax or repeated scroll animations.
- No glowing shadows on components.
