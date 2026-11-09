import { useState } from 'react'
import { Home } from 'lucide-react'

interface PropertyImageProps {
  src: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}

export function PropertyImage({ src, alt, className = '', loading = 'lazy' }: PropertyImageProps) {
  const [failed, setFailed] = useState(false)

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
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
