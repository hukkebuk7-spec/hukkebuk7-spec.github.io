import { useEffect } from 'react'
import { SITE, pageUrl } from '../lib/site'

type PageMetaProps = {
  title: string
  description: string
  path: string
  noindex?: boolean
  type?: 'website' | 'article'
}

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

export function PageMeta({ title, description, path, noindex = false, type = 'website' }: PageMetaProps) {
  useEffect(() => {
    const fullTitle = path === '/' ? SITE.defaultTitle : `${title} — ${SITE.name}`
    const canonical = pageUrl(path)
    document.title = fullTitle

    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMeta('meta[property="og:type"]', 'property', 'og:type', type)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = canonical
  }, [title, description, path, noindex, type])

  return null
}
