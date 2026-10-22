import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist'
const fallbackBase = 'https://tempo-field-guide.pages.dev'
const base = (process.env.VITE_SITE_URL ?? fallbackBase).replace(/\/$/, '')

const routes = [
  {
    dir: 'lab',
    title: 'The lab — TEMPO',
    description:
      'Tune interface motion by feel: a cubic bezier easing editor, a spring simulator, and a stagger composer, each with copyable CSS or JS.',
  },
  {
    dir: 'library',
    title: 'Pattern library — TEMPO',
    description:
      'Twelve tested interface motion patterns with live demos, keyboard support, reduced-motion fallbacks, and copyable code.',
  },
  {
    dir: 'about',
    title: 'Method & colophon — TEMPO',
    description:
      'How TEMPO approaches interface motion: principles, accessibility, performance, and the honest limits of a static field guide.',
  },
]

let template = readFileSync(join(dist, 'index.html'), 'utf8').replaceAll(fallbackBase, base)
writeFileSync(join(dist, 'index.html'), template)

const jsonLd = template.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
if (!jsonLd) throw new Error('postbuild: JSON-LD block missing')
const jsonLdHash = createHash('sha256').update(jsonLd[1]).digest('base64')

let headers = readFileSync(join(dist, '_headers'), 'utf8')
if (!headers.includes('__JSONLD_HASH__')) throw new Error('postbuild: CSP hash placeholder missing')
headers = headers.replace('__JSONLD_HASH__', `'sha256-${jsonLdHash}'`)
writeFileSync(join(dist, '_headers'), headers)

for (const file of ['robots.txt', 'sitemap.xml']) {
  const path = join(dist, file)
  writeFileSync(path, readFileSync(path, 'utf8').replaceAll(fallbackBase, base))
}

const replaceMeta = (html, { title, description, url, noindex = false }) => {
  let output = html
  output = output.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  output = output.replace(
    /(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/,
    `$1${description}$2`,
  )
  output = output.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
  output = output.replace(/(<meta\s+property="og:title"\s+content=")[^"]*("\s*\/?>)/, `$1${title}$2`)
  output = output.replace(
    /(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/?>)/,
    `$1${description}$2`,
  )
  output = output.replace(/(<meta\s+property="og:url"\s+content=")[^"]*("\s*\/?>)/, `$1${url}$2`)
  output = output.replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*("\s*\/?>)/, `$1${title}$2`)
  output = output.replace(
    /(<meta\s+name="twitter:description"\s+content=")[^"]*("\s*\/?>)/,
    `$1${description}$2`,
  )
  if (noindex) {
    output = output.replace(
      '</head>',
      '    <meta name="robots" content="noindex, nofollow" />\n  </head>',
    )
  }
  return output
}

for (const route of routes) {
  const html = replaceMeta(template, {
    title: route.title,
    description: route.description,
    url: `${base}/${route.dir}`,
  })
  const target = join(dist, route.dir)
  mkdirSync(target, { recursive: true })
  writeFileSync(join(target, 'index.html'), html)
}

const notFound = replaceMeta(template, {
  title: 'Page not found — TEMPO',
  description: 'This page has left the timeline. Return to TEMPO’s field guide to interface motion.',
  url: `${base}/404`,
  noindex: true,
})
writeFileSync(join(dist, '404.html'), notFound)

console.log(`postbuild: wrote ${routes.length} route entries + 404.html`)
