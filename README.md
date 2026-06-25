# IKRAM Maldives

Website for **IKRAM** — a Maldivian Islamic da'wah jamiyyah founded in 2026, devoted to knowledge, worship, and community.

A multi-page static site (no build step) in a terracotta / parchment / espresso palette, animated with GSAP + ScrollTrigger and Lenis smooth scrolling. Brand mark: calligraphic IKRAM lockup (terracotta on light, cream on dark).

## Pages
`index` · `about` · `articles` · `resources` · `events` · `contact` · `article` (template)

## Stack
- Plain HTML/CSS/JS — `assets/css/styles.css`, `assets/js/main.js`, `assets/js/animations.js`
- GSAP 3.13 + ScrollTrigger (cdnjs), Lenis (jsdelivr) — all loaded via CDN
- Fonts: Cormorant Garamond (headlines) · Jost (everything else) · Amiri + IBM Plex Sans Arabic (Arabic) — Google Fonts
- Palette adds Forest Green `#1E5B43` as the secondary brand colour alongside Terracotta
- Animations respect `prefers-reduced-motion`; content never hidden if JS fails

## Run locally
```bash
npx serve .
```

## Deploy
Hosted on [Vercel](https://vercel.com). Any push to `main` redeploys automatically.
