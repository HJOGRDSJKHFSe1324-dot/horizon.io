# SA-08 Hero Text Handoff

## Scope completed
- Created `src/components/HorizonHeroText.tsx`.
- Static "HORIZON AI" wordmark using the display face, with the restrained HORIZON blue accent on "AI" only.
- Overlay root is absolutely positioned (`absolute inset-0`) and carries no rotation/animation, so it stays fixed while an underlying logo spins.
- Responsive size presets exported via `horizonHeroTextSizes` (`sm`/`md`/`lg`/`xl`) and a `size` prop.
- Named + default exports provided for consumer flexibility.

## Notes for next agents
- Place `HorizonHeroText` as an absolutely-positioned sibling/overlay inside the hero logo container's positioning context.
- Do not wrap it in a rotating parent; keep it outside the spinning element so it remains static.
- Use tokens (`text-fg`, `text-accent`, `font-display`); no gradient text.
- Reduced-motion safe (no animation).

## Changed files
- src/components/HorizonHeroText.tsx
- HANDOFF_SA-08.md
