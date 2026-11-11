import { useState } from 'react'
import { Home } from 'lucide-react'
import { buildImageSources } from '../lib/image'

interface PropertyImageProps {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
  /** Responsive widths to offer via srcSet. Defaults to a single 800px image. */
  widths?: number[]
  sizes?: string
}

export function PropertyImage({
  src,
  alt,
  className = '',
  loading = 'lazy',
  widths = [800],
  sizes,
}: PropertyImageProps) {
  const [failed, setFailed] = useState(false)
  const sources = buildImageSources(src, widths, sizes ?? '')

  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500 ${className}`} role="img" aria-label={`${alt} — foto tidak tersedia`}>
        <Home className="h-8 w-8" aria-hidden="true" />
        <span className="text-xs font-medium">Foto tidak tersedia</span>
      </div>
    )
  }

  return (
    <img
      src={sources?.src ?? src}
      srcSet={sources?.srcSet}
      sizes={sources?.srcSet ? sources.sizes : undefined}
      alt={alt}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
