import { useEffect } from 'react'
import { DEFAULT_OG_IMAGE_URL, absoluteUrl, siteBaseUrl } from '../lib/seo'

interface SeoProps {
  /** <title> text. Always includes the " - properti1.com" suffix. */
  title: string
  description: string
  /** Route path used for the canonical link, e.g. `/properti/abc`. */
  path: string
  image?: string
  /** Keeps non-public routes out of search results. */
  noIndex?: boolean
  type?: 'website' | 'article'
}

const upsertMeta = (key: 'name' | 'property', value: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(key, value)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
  return element
}

/**
 * Declarative, dependency-free document head for a single page.
 *
 * The site is a client-rendered SPA, so crawlers such as Google execute this
 * after hydration while WhatsApp/Facebook fall back to the static tags in
 * index.html. <html lang> lives in index.html so it must not be overwritten here.
 */
export function Seo({ title, description, path, image, noIndex = false, type = 'website' }: SeoProps) {
  useEffect(() => {
    const canonicalUrl = absoluteUrl(path)
    const absoluteImage = image
      ? image.startsWith('http')
        ? image
        : siteBaseUrl() + image
      : DEFAULT_OG_IMAGE_URL

    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:image', absoluteImage)
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', absoluteImage)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl
  }, [title, description, path, image, noIndex, type])

  return null
}
