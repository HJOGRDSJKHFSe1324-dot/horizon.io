# HANDOFF

## SA-04 Logo Prep
Delivered original transparent-background brand assets:
- `/public/brand/horizon-mark.svg` (accessible `<title>`/`<desc>`, color-scheme aware)
- `/public/brand/horizon-wordmark.svg`
- `/public/favicon.svg`
- Exported PNG sizes in `/public/brand/horizon-mark-{16,32,48,180,192,512}.png`

### Metadata wiring for SA-24 (not edited here per SA-04 scope)
Suggested Next.js `Metadata` icons:
```ts
icons: {
  icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/brand/horizon-mark-32.png", sizes: "32x32", type: "image/png" }],
  shortcut: "/favicon.svg",
  apple: "/brand/horizon-mark-180.png",
},
openGraph: { images: ["/brand/horizon-mark-512.png"] },
```
Also copy 180px export to `/public/apple-touch-icon.png` if desired, and reference the mark in header/brand components with explicit alt text "HORIZON" and reserved dimensions to avoid layout shift.