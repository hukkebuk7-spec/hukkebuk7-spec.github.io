# TEMPO

A field guide to interface motion: principles, working labs, a tested pattern
library, and a practical motion budget.

TEMPO is a static React site. It has no backend, no accounts, no analytics, and
no cookies. Motion preferences and the motion-budget checklist are stored only
in the browser.

## Local development

```bash
npm install
npm run dev
```

Open the URL printed by Vite. The site is also available at `/lab`, `/library`,
and `/about`; unknown paths render the custom 404 page.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check, build, and generate static route HTML |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript project checks |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run Playwright and axe checks on desktop and mobile |

Install browsers once before running the test suite:

```bash
npx playwright install chromium webkit
```

## Production build

```bash
VITE_SITE_URL=https://your-project.pages.dev npm run build
```

`VITE_SITE_URL` controls canonical URLs, Open Graph URLs, the sitemap, and the
structured-data URL. `scripts/postbuild.mjs` also generates `/lab/index.html`,
`/library/index.html`, `/about/index.html`, and `404.html`, then injects the
CSP hash for the inline JSON-LD block.

Deploy the generated `dist/` directory to any static host.

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `VITE_SITE_URL=https://<project-name>.pages.dev`
- Node version: 22 or newer

`public/_headers` adds security headers, a content security policy, and caching
rules. Static route HTML is generated at build time so direct navigation to
`/lab`, `/library`, and `/about` works without SPA rewrites.

## Motion and animation

Motion is layered and progressive:

- CSS handles entrance reveals, heading word masks, the route-change wipe, and
  the footer variable-font scrub. Content is visible without JavaScript.
- GSAP and ScrollTrigger are imported dynamically for the sticky pattern reel,
  the hero parallax, the lab-curve runner, and the duration ruler. If the import
  fails, those sections fall back to static layouts.
- The home hero upgrades from a 2D canvas waveform to a lazy-loaded Three.js
  field when WebGL is available. A lost context or failed module falls back to
  the 2D canvas.

Both the explicit motion switch and `prefers-reduced-motion` disable the GSAP
scrub, the route wipe, and the 3D field. The pattern register becomes a static
grid, and scroll-driven content remains in the normal document flow. There is no
scroll-jacking.

## Jarvis

Jarvis is the site's local motion assistant. Open it from the header, the closing
section, or with `Ctrl K` / `Cmd K`. It answers questions about easing, springs,
stagger, reduced motion, performance, and the pattern library, and it can audit
the rendered page's computed motion, change the motion preference, or link to a
relevant route.

Everything runs in the browser: there is no model call, no network request for
answers, and no stored transcript. Voice input and spoken replies use the
browser's own Speech APIs when available and degrade to typing; the site stores
no audio, but the browser may process speech on its own servers. The panel traps
focus, closes on `Escape`, restores focus to its trigger, and is covered by the
axe checks.

The **wake word** switch arms a continuous listener while the tab is open: say
“Jarvis” and the panel opens, then either sends the rest of the sentence as the
question or starts listening for one. The preference is stored locally. Chrome
on Android is the best-supported target; Safari and Firefox may not expose the
Speech Recognition API. A page cannot listen once the tab is closed, and iOS may
suspend background audio, so this is not a system-wide assistant.

## Structure

```text
src/
  components/   Shared chrome and UI primitives
  features/     Easing, spring, stagger, pattern demos, reel, 3D field, and Jarvis
  lib/          Motion preference, metadata, clipboard, scroll, WebGL, and Jarvis brain
  pages/        Home, lab, library, about, and 404
  styles/       Tokens, base styles, UI, home, page, and Jarvis styles
public/         Icons, manifest, social image, headers, robots, sitemap
scripts/        Static route and CSP post-build step
tests/          Playwright interaction and accessibility checks
```

## Accessibility

The interface supports full keyboard navigation, visible focus states, native
dialogs, reduced-motion overrides, and an explicit motion switch. The Playwright
suite includes axe checks at WCAG 2.1 AA for every route on desktop and mobile.
