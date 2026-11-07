# HORIZON Design Direction v2 (Polish Pass)

## Concept
"Premium AI workstation / future operating system" — restrained, editorial, product-led. One strong idea per screen, asymmetric rhythm, high typographic discipline, purposeful motion, no generic AI-template tropes.

## Palette
- Dark:
  - bg #0B0D12
  - raised #12151D
  - surface2 #1A1E28
  - border #262B3A
  - text #F5F7FA
  - muted #A3AAB9
  - subtle #6B7280
  - accent #4F7CF3 (hover #6B90FF)
  - AI accent #22D3EE
  - success #22C55E, danger #F87171
- Light:
  - bg #F6F8FC
  - raised #FFFFFF
  - surface2 #EEF2F8
  - border #DCE3EE
  - text #0F172A
  - muted #475569
  - subtle #94A3B8
  - accent #3B63D6 (hover #4F7CF3)
  - AI accent #0891B2

## Typography
- Display: Plus Jakarta Sans 500–600, tracking -0.02em, tight line height 1.05.
- UI/body: Inter 400–500, line-height 1.5–1.6.
- Code/metrics: Geist Mono 400, slightly larger size for console-like utility.
- Type scale: 12/14/16/18/20/24/32/40/48.
- Measure: keep body paragraphs ≤ 68ch.

## Spacing and layout
- 4px grid (4, 8, 12, 16, 24, 32, 48, 64, 96).
- Max content width 1280px, with 1120px text measure.
- Standard section padding: 96px desktop, 64px tablet, 44px mobile.
- Avoid perfect symmetry: alternate centered and split layouts per section.
- Cards only when information density benefits. Avoid repeating identical card grids.

## Radius and surfaces
- Controls 6px, cards 12px, overlay/drawer 16px, pills 999px.
- Borders 1px, subtle. Elevation via soft shadow, not glowing.
- Glass only on chat composer and floating panels.

## Motion
- Duration: 100ms micro, 180ms control, 240ms panel, 320ms page.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Animate transform + opacity only; respect `prefers-reduced-motion`.
- Scroll reveals translate ≤ 18px and only once.
- Chat streaming should use stable placeholder height to reduce layout shift.

## Components
- Primary CTA: solid ink.
- Secondary: bordered surface.
- Destructive: muted red, requires confirmation.
- Status: badges with text labels, not color alone.

## Copy tone
- Short, concrete, product-led, no filler tropes.
- Explain tradeoffs plainly.
- Never invent benchmarks, capabilities, or results.
- State what requires external configuration.

## Anti-AI compliance targets
- No default purple-blue neon blobs.
- No emoji-as-icons.
- No repetitive three-column feature grids.
- No filler copy or marketing cliches.
- No placeholders/lorem/fake logos.
- No unnecessary animation repetition.
- No generic purple-to-blue hero default everywhere.
- Distinct hover/focus/empty/loading states.