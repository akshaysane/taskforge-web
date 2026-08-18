import { useEffect, useRef, useState } from 'react'
import { attachMedia, completeMediaUpload, createMediaUpload, detachMedia, uploadPresignedFile, type MediaLink, type MediaOwnerType, type MediaPurpose } from '../../api/media'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

type UploadState = 'idle' | 'uploading' | 'failed' | 'ready'
type PendingPhoto = { file: File; previewUrl: string; state: UploadState; link?: MediaLink }

interface PhotoUploaderProps {
  ownerType: MediaOwnerType
  ownerId: string
  purpose: MediaPurpose
  maxPhotos: number
  existingPhotos?: MediaLink[]
  onChange: (photos: MediaLink[]) => void
}

function mergePhotos(existing: MediaLink[], pending: PendingPhoto[]): MediaLink[] {
  const knownIds = new Set(existing.map((photo) => photo.id))
  return [...existing, ...pending.flatMap((photo) => photo.link && !knownIds.has(photo.link.id) ? [photo.link] : [])]
}

export default function PhotoUploader({ ownerType, ownerId, purpose, maxPhotos, existingPhotos = [], onChange }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<PendingPhoto[]>([])
  const [error, setError] = useState('')
  const photosRef = useRef(photos)

  useEffect(() => { photosRef.current = photos }, [photos])
  useEffect(() => () => { photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)) }, [])

  function updatePhoto(file: File, patch: Partial<PendingPhoto>) {
    setPhotos((current) => current.map((photo) => photo.file === file ? { ...photo, ...patch } : photo))
  }

  async function upload(file: File) {
    updatePhoto(file, { state: 'uploading' })
    setError('')
    try {
      const session = await createMediaUpload({ mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp', byteSize: file.size })
      await uploadPresignedFile(session.upload.url, session.upload.headers, file)
      await completeMediaUpload(session.mediaAsset.id)
      const link = await attachMedia(ownerType, ownerId, session.mediaAsset.id, purpose, photosRef.current.filter((photo) => photo.link).length)
      updatePhoto(file, { state: 'ready', link })
      setPhotos((current) => {
        const next = current.map((photo) => photo.file === file ? { ...photo, state: 'ready' as const, link } : photo)
        onChange(mergePhotos(existingPhotos, next))
        return next
      })
    } catch {
      updatePhoto(file, { state: 'failed' })
    }
  }

  function selectFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    const valid = files.filter((file) => ACCEPTED_TYPES.has(file.type) && file.size <= MAX_FILE_SIZE)
    if (valid.length !== files.length) setError('Photos must be JPEG, PNG, or WebP and 10 MB or smaller.')
    const currentCount = new Set([...existingPhotos.map((photo) => photo.id), ...photosRef.current.flatMap((photo) => photo.link ? [photo.link.id] : [photo.previewUrl])]).size
    const available = Math.max(0, maxPhotos - currentCount)
    const selected = valid.slice(0, available)
    if (valid.length > available) setError(`You can add up to ${maxPhotos} photos.`)
    const pending = selected.map((file) => ({ file, previewUrl: URL.createObjectURL(file), state: 'idle' as const }))
    setPhotos((current) => [...current, ...pending])
    pending.forEach((photo) => { void upload(photo.file) })
  }

  async function remove(photo: PendingPhoto) {
    try {
      if (photo.link) await detachMedia(ownerType, ownerId, photo.link.mediaAssetId)
    } catch {
      setError('Could not remove the photo. Please retry.')
      return
    }
    URL.revokeObjectURL(photo.previewUrl)
    setPhotos((current) => {
      const next = current.filter((candidate) => candidate !== photo)
      onChange(mergePhotos(existingPhotos.filter((candidate) => candidate.id !== photo.link?.id), next))
      return next
    })
  }

  return <section className="photo-uploader" aria-label="Photos">
    <p className="sr-only" role="status" aria-live="polite">{photos.find((photo) => photo.state === 'uploading') ? `Uploading ${photos.find((photo) => photo.state === 'uploading')!.file.name}.` : ''}</p>
    <label className="button button-secondary">Add photo
      <input aria-label="Add photo" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectFiles} hidden disabled={existingPhotos.length + photos.filter((photo) => !photo.link).length >= maxPhotos} />
    </label>
    <p className="photo-help">JPEG, PNG, or WebP images, up to 10 MB each.</p>
    {error ? <p className="field-error" role="alert">{error}</p> : null}
    <div className="photo-preview-grid">
      {photos.map((photo) => <figure key={photo.previewUrl} className="photo-preview">
        <img src={photo.previewUrl} alt={photo.file.name} />
        {photo.state === 'uploading' ? <figcaption>Uploading photo…</figcaption> : null}
        {photo.state === 'failed' ? <figcaption>Upload failed. <button type="button" onClick={() => { void upload(photo.file) }} aria-label={`Retry ${photo.file.name}`}>Retry</button></figcaption> : null}
        <button type="button" className="icon-button" aria-label={`Remove ${photo.file.name}`} disabled={photo.state === 'uploading'} onClick={() => { void remove(photo) }}>×</button>
      </figure>)}
    </div>
  </section>
}
