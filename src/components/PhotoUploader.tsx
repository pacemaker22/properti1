import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus, Star, Trash2, Upload } from 'lucide-react'

export interface PhotoPreview {
  id: string
  url: string
  name: string
  existing?: boolean
  file?: File
}

interface PhotoUploaderProps {
  photos: PhotoPreview[]
  onChange: (photos: PhotoPreview[]) => void
  error?: string
}

export function PhotoUploader({ photos, onChange, error }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [fileError, setFileError] = useState('')

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const nextPhotos = [...photos]
    let nextError = ''

    Array.from(fileList).forEach((file) => {
      if (nextPhotos.length >= 8) {
        nextError = 'Maksimal 8 foto per iklan.'
        return
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        nextError = 'Format foto harus JPG atau PNG.'
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        nextError = `Ukuran foto "${file.name}" melebihi 5 MB.`
        return
      }
      nextPhotos.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        url: URL.createObjectURL(file),
        name: file.name,
        file,
      })
    })

    setFileError(nextError)
    if (nextPhotos.length !== photos.length) onChange(nextPhotos)
  }

  const removePhoto = (photoId: string) => {
    const removed = photos.find((photo) => photo.id === photoId)
    if (!removed?.existing && removed?.url.startsWith('blob:')) {
      URL.revokeObjectURL(removed.url)
    }
    onChange(photos.filter((photo) => photo.id !== photoId))
  }

  const makeCover = (photoId: string) => {
    const selected = photos.find((photo) => photo.id === photoId)
    if (!selected) return
    onChange([selected, ...photos.filter((photo) => photo.id !== photoId)])
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  const displayedError = error || fileError

  return (
    <div>
      <div
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false)
        }}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-8 ${
          dragging
            ? 'border-primary-500 bg-slate-50'
            : displayedError
              ? 'border-error-red bg-slate-50'
              : 'border-slate-300 bg-slate-50 hover:border-primary-500'
        }`}
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary-500 shadow-sm">
          <Upload size={22} aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-sm font-bold text-navy">Unggah foto properti</h3>
        <p className="mt-1.5 text-xs leading-5 text-text-grey">
          Seret dan lepas foto di sini atau pilih dari perangkat Anda.
          <br />JPG/PNG, maksimal 5 MB per foto, maksimal 8 foto.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-navy transition hover:border-primary-500 hover:text-primary-600"
        >
          <ImagePlus size={17} aria-hidden="true" /> Pilih Foto
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          className="sr-only"
          aria-label="Pilih foto properti"
          onChange={(event) => {
            handleFiles(event.target.files)
            event.target.value = ''
          }}
        />
      </div>

      {displayedError && (
        <p className="mt-2 text-xs font-medium text-error-red" role="alert">
          {displayedError}
        </p>
      )}

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <img
                src={photo.url}
                alt={`Pratinjau foto ${index + 1}: ${photo.name}`}
                className="aspect-[4/3] w-full object-cover"
              />
              {index === 0 && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg bg-primary-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
                  <Star size={11} fill="currentColor" aria-hidden="true" /> Foto Utama
                </span>
              )}
              <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(photo.id)}
                    className="flex h-9 items-center gap-1 rounded-lg bg-white/95 px-2 text-[11px] font-bold text-navy shadow-sm transition hover:text-primary-600"
                    aria-label={`Jadikan ${photo.name} sebagai foto utama`}
                  >
                    <Star size={13} aria-hidden="true" /> Utama
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/95 text-error-red shadow-sm transition hover:bg-slate-100"
                  aria-label={`Hapus foto ${photo.name}`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
