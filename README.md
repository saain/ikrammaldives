# IKRAM Maldives

Website for **IKRAM** — a Maldivian Islamic da'wah jamiyyah founded in 2026, devoted to knowledge, worship, and community.

A multi-page static site (no build step) in a parchment / emerald / brass palette, animated with GSAP + ScrollTrigger and Lenis smooth scrolling.

## Pages
`index` · `about` · `articles` · `resources` · `events` · `contact` · `article` (template)

## Stack
- Plain HTML/CSS/JS — `assets/css/styles.css`, `assets/js/main.js`, `assets/js/animations.js`
- GSAP 3.13 + ScrollTrigger (cdnjs), Lenis (jsdelivr) — all loaded via CDN
- Fonts: Fraunces · Plus Jakarta Sans · Amiri · Reem Kufi (Google Fonts)
- Animations respect `prefers-reduced-motion`; content never hidden if JS fails

## Run locally
```bash
npx serve .
```

## Deploy
Hosted on [Vercel](https://vercel.com). Any push to `main` redeploys automatically.
