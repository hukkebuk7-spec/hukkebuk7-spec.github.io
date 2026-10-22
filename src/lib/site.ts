export const SITE = {
  name: 'TEMPO',
  tagline: 'A field guide to interface motion',
  edition: 'Edition 01 — 2026',
  url: import.meta.env.VITE_SITE_URL ?? 'https://tempo-field-guide.pages.dev',
  defaultTitle: 'TEMPO — A field guide to interface motion',
  defaultDescription:
    'TEMPO is a practical field guide to interface motion: principles, a working easing and spring lab, a pattern library, and a motion budget.',
  author: 'TEMPO',
} as const

export const pageUrl = (path: string) => `${SITE.url.replace(/\/$/, '')}${path}`
