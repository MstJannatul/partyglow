import { useEffect } from 'react'

interface SEOProps {
  title: string
  description: string
  canonicalPath?: string // relative path like "/browse"
  ogImagePath?: string // relative or absolute
  noIndex?: boolean
  jsonLd?: object | object[]
  additionalMeta?: Record<string, string>
}

function ensureMetaByName(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function ensureMetaByProperty(property: string, content: string) {
  let tag = document.querySelector(`meta[property="${property}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function ensureLink(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`)
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', rel)
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

function toAbsolute(path?: string) {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  if (typeof window === 'undefined') return path // best effort
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`
}

export function SEO({
  title,
  description,
  canonicalPath,
  ogImagePath,
  noIndex,
  jsonLd,
  additionalMeta
}: SEOProps) {
  useEffect(() => {
    // Title & description
    document.title = title
    ensureMetaByName('description', description)

    // Robots
    ensureMetaByName('robots', noIndex ? 'noindex,follow' : 'index,follow')

    // Canonical
    if (canonicalPath) {
      const abs = toAbsolute(canonicalPath)!
      ensureLink('canonical', abs)
      ensureMetaByProperty('og:url', abs)
    }

    // OpenGraph
    ensureMetaByProperty('og:title', title)
    ensureMetaByProperty('og:description', description)
    ensureMetaByProperty('og:type', 'website')
    if (ogImagePath) {
      const absImg = toAbsolute(ogImagePath)!
      ensureMetaByProperty('og:image', absImg)
    }

    // Twitter
    ensureMetaByName('twitter:card', 'summary_large_image')
    ensureMetaByName('twitter:title', title)
    ensureMetaByName('twitter:description', description)
    if (ogImagePath) {
      const absImg = toAbsolute(ogImagePath)!
      ensureMetaByName('twitter:image', absImg)
    }

    // Additional meta
    if (additionalMeta) {
      Object.entries(additionalMeta).forEach(([key, value]) =>
        ensureMetaByName(key, value)
      )
    }

    // Structured data
    const hasJsonLd = !!jsonLd
    const existing = document.getElementById(
      'seo-jsonld'
    ) as HTMLScriptElement | null
    if (hasJsonLd) {
      const script: HTMLScriptElement =
        existing ?? (document.createElement('script') as HTMLScriptElement)
      script.id = 'seo-jsonld'
      script.type = 'application/ld+json'
      const payload = Array.isArray(jsonLd) ? jsonLd : [jsonLd]
      script.text = JSON.stringify(payload)
      if (!existing) document.head.appendChild(script)
    } else if (existing) {
      existing.remove()
    }
  }, [
    title,
    description,
    canonicalPath,
    ogImagePath,
    noIndex,
    JSON.stringify(jsonLd),
    JSON.stringify(additionalMeta)
  ])

  return null
}
