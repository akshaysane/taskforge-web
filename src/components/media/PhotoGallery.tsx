import { useState } from 'react'
import { detachMedia, getMediaReadUrl, type MediaLink, type MediaOwnerType } from '../../api/media'

interface PhotoGalleryProps {
  photos: MediaLink[]
  ownerType: MediaOwnerType
  ownerId: string
  onChange: (photos: MediaLink[]) => void
  readOnly?: boolean
}

export default function PhotoGallery({ photos, ownerType, ownerId, onChange, readOnly = false }: PhotoGalleryProps) {
  const [readUrls, setReadUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [removing, setRemoving] = useState<Record<string, boolean>>({})
  const [removeError, setRemoveError] = useState('')

  async function loadPhoto(photo: MediaLink) {
    if (readUrls[photo.mediaAssetId] || loading[photo.mediaAssetId]) return
    setLoading((current) => ({ ...current, [photo.mediaAssetId]: true }))
    try {
      const read = await getMediaReadUrl(photo.mediaAssetId)
      setReadUrls((current) => ({ ...current, [photo.mediaAssetId]: read.url }))
      setErrors((current) => ({ ...current, [photo.mediaAssetId]: false }))
    } catch {
      setErrors((current) => ({ ...current, [photo.mediaAssetId]: true }))
    } finally {
      setLoading((current) => ({ ...current, [photo.mediaAssetId]: false }))
    }
  }

  async function removePhoto(photo: MediaLink) {
    setRemoveError('')
    setRemoving((current) => ({ ...current, [photo.id]: true }))
    try {
      await detachMedia(ownerType, ownerId, photo.mediaAssetId)
      onChange(photos.filter((candidate) => candidate.id !== photo.id))
    } catch {
      setRemoveError('Could not remove this photo. Please retry.')
    } finally {
      setRemoving((current) => ({ ...current, [photo.id]: false }))
    }
  }

  if (photos.length === 0) return null
  return <section className="photo-gallery" aria-label="Attached photos">
    <h2>Reference photos</h2>
    {removeError ? <p className="field-error" role="alert">{removeError}</p> : null}
    <div className="photo-preview-grid">
      {photos.map((photo) => <figure key={photo.id} className="photo-preview">
        {readUrls[photo.mediaAssetId]
          ? <img src={readUrls[photo.mediaAssetId]} alt={photo.caption || 'Reference photo'} />
          : <button type="button" className="button button-secondary" onClick={() => { void loadPhoto(photo) }} disabled={loading[photo.mediaAssetId]}>{loading[photo.mediaAssetId] ? 'Loading photo…' : 'Load photo'}</button>}
        {errors[photo.mediaAssetId] ? <div role="alert">Could not load this photo. <button type="button" onClick={() => { void loadPhoto(photo) }} aria-label={`Retry loading ${photo.caption || 'Reference photo'}`}>Retry</button></div> : null}
        {photo.caption ? <figcaption>{photo.caption}</figcaption> : null}
        {!readOnly ? <button type="button" className="icon-button" aria-label={`Remove ${photo.caption || 'Reference photo'}`} disabled={removing[photo.id]} onClick={() => { void removePhoto(photo) }}>×</button> : null}
      </figure>)}
    </div>
  </section>
}
