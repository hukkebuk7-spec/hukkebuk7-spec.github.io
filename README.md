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

## Structure

```text
src/
  components/   Shared chrome and UI primitives
  features/     Easing, spring, stagger, and pattern demos
  lib/          Motion preference, metadata, and clipboard utilities
  pages/        Home, lab, library, about, and 404
  styles/       Tokens, base styles, UI, home, and page styles
public/         Icons, manifest, social image, headers, robots, sitemap
scripts/        Static route and CSP post-build step
tests/          Playwright interaction and accessibility checks
```

## Accessibility

The interface supports full keyboard navigation, visible focus states, native
dialogs, reduced-motion overrides, and an explicit motion switch. The Playwright
suite includes axe checks at WCAG 2.1 AA for every route on desktop and mobile.
