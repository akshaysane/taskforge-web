import { useState } from 'react'
import { getMediaReadUrl, type MediaLink } from '../../api/media'

interface PhotoGalleryProps { photos: MediaLink[] }

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [readUrls, setReadUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  async function loadPhoto(photo: MediaLink) {
    if (readUrls[photo.mediaAssetId] || loading[photo.mediaAssetId]) return
    setLoading((current) => ({ ...current, [photo.mediaAssetId]: true }))
    try {
      const read = await getMediaReadUrl(photo.mediaAssetId)
      setReadUrls((current) => ({ ...current, [photo.mediaAssetId]: read.url }))
    } finally {
      setLoading((current) => ({ ...current, [photo.mediaAssetId]: false }))
    }
  }

  if (photos.length === 0) return null
  return <section className="photo-gallery" aria-label="Attached photos">
    <h2>Reference photos</h2>
    <div className="photo-preview-grid">
      {photos.map((photo) => <figure key={photo.id} className="photo-preview">
        {readUrls[photo.mediaAssetId]
          ? <img src={readUrls[photo.mediaAssetId]} alt={photo.caption || 'Reference photo'} />
          : <button type="button" className="button button-secondary" onClick={() => { void loadPhoto(photo) }} disabled={loading[photo.mediaAssetId]}>{loading[photo.mediaAssetId] ? 'Loading photo…' : 'Load photo'}</button>}
        {photo.caption ? <figcaption>{photo.caption}</figcaption> : null}
      </figure>)}
    </div>
  </section>
}
