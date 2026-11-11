import { useEffect, useMemo } from 'react'

interface JsonLdProps {
  /** schema.org object built by lib/seo.ts. */
  data: Record<string, unknown>
}

const DATA_ATTRIBUTE = 'data-properti1-jsonld'

/**
 * Renders a schema.org block into <head>.
 *
 * JSON is emitted with JSON.stringify and dropped into a <script> via
 * textContent (never dangerouslySetInnerHTML). Even so, `<` is escaped so a
 * seller cannot close the script tag early with a crafted listing title.
 */
export function JsonLd({ data }: JsonLdProps) {
  const serialized = useMemo(() => JSON.stringify(data), [data])

  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute(DATA_ATTRIBUTE, '')
    script.textContent = serialized
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [serialized])

  return null
}
