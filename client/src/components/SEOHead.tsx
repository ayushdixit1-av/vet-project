import { useEffect } from 'react'

interface SEOHeadProps {
  title?: string
  description?: string
  ogImage?: string
}

const SITE_NAME = 'VetCrack'

export default function SEOHead({ title, description, ogImage }: SEOHeadProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
    document.title = fullTitle

    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name'
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', description || 'Your comprehensive veterinary knowledge platform.')
    setMeta('og:title', title || SITE_NAME, true)
    setMeta('og:description', description || 'Your comprehensive veterinary knowledge platform.', true)
    setMeta('og:image', ogImage || '', true)
    setMeta('og:site_name', SITE_NAME, true)
    setMeta('og:type', 'website', true)
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', title || SITE_NAME)
    setMeta('twitter:description', description || 'Your comprehensive veterinary knowledge platform.')
    if (ogImage) setMeta('twitter:image', ogImage)

    return () => {
      document.title = SITE_NAME
    }
  }, [title, description, ogImage])

  return null
}
