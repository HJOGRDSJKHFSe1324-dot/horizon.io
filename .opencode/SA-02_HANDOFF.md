# SA-02 Typography Handoff

## Fonts (freely licensed, self-hosted via next/font/google)
- Display: Space Grotesk (weights 500, 600) -> CSS var `--font-display`
- Body: Manrope (weights 400, 500) -> CSS var `--font-body`
- Mono: JetBrains Mono (weight 400) -> CSS var `--font-mono`

## Files changed
- `src/app/layout.tsx` — font wiring, three next/font/google instances exposing CSS variables.
- `src/styles/typography.css` — new: type scale vars (--text-12..--text-48), line heights, measures, heading/body/code styles, utility classes.
- `src/app/globals.css` — imports typography.css; updated base font family and `.markdown code` to `--font-mono`.

## Tokens / classes for other agents
- Type scale vars: `--text-12, --text-14, --text-16, --text-18, --text-20, --text-24, --text-32, --text-40, --text-48`.
- Line height vars: `--leading-tight/snug/normal/loose`.
- Measures: `--measure-prose (68ch)`, `--measure-narrow`, `--measure-text`, `--measure-content`.
- Families: `.font-display`, `.font-body`, `.font-mono`.
- Headings h1–h6 styled with display face, tracking -0.02em.

## Notes
- Inter/Roboto/Arial/system fonts removed from layout path.
- Body default remains dark-first; light mode inherited from globals variables.
- No component changes made.