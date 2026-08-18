import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { InventoryItem } from '../../api/inventory'
import { getMediaReadUrl } from '../../api/media'
import LifecycleBadge from './LifecycleBadge'

export default function InventoryCard({ item }: { item: InventoryItem }) {
  const readyMedia = item.media?.find((media) => media.mediaAsset.uploadStatus === 'READY')
  const readyMediaId = readyMedia?.mediaAssetId ?? ''
  const [photoResult, setPhotoResult] = useState<{ mediaAssetId: string; url: string; failed: boolean }>({ mediaAssetId: '', url: '', failed: false })

  useEffect(() => {
    if (!readyMediaId) return
    let active = true
    void getMediaReadUrl(readyMediaId).then(({ url }) => { if (active) setPhotoResult({ mediaAssetId: readyMediaId, url, failed: false }) }).catch(() => { if (active) setPhotoResult({ mediaAssetId: readyMediaId, url: '', failed: true }) })
    return () => { active = false }
  }, [readyMediaId])

  const currentPhoto = photoResult.mediaAssetId === readyMediaId ? photoResult : { mediaAssetId: readyMediaId, url: '', failed: false }
  const photoLabel = readyMedia?.caption || `Photo of ${item.inventoryCode}`
  const primaryMeasurement = item.measurements[0]
  return <article className="inventory-card"><div className="inventory-card-media">{currentPhoto.url && !currentPhoto.failed ? <img src={currentPhoto.url} alt={photoLabel} onError={() => setPhotoResult({ mediaAssetId: readyMediaId, url: '', failed: true })} /> : <span role="img" aria-label={currentPhoto.failed ? `Photo unavailable for ${item.inventoryCode}` : `No photo for ${item.inventoryCode}`}>{currentPhoto.failed ? 'Photo unavailable' : readyMedia ? 'Loading photo…' : 'No photo'}</span>}</div><div className="inventory-card-copy"><strong>{item.inventoryCode}</strong><span>{item.originalSet?.design.name ?? 'Inventory design'} · {item.originalSet?.originalSetCode ?? 'No original set'} · {item.pieceType?.name ?? 'Piece'}</span><span>{item.customSize ? `Size ${item.customSize}` : 'No size'} · {primaryMeasurement ? `${primaryMeasurement.label}: ${primaryMeasurement.value}` : 'No measurements'} · {item.storageLocation || 'No location'}</span></div><div className="inventory-card-actions"><LifecycleBadge status={item.lifecycleStatus} /><span>{item.lifecycleStatus === 'ACTIVE' ? 'Available' : 'Unavailable'}</span><Link className="button button-secondary" to={`/inventory/${item.inventoryCode}`}>View item</Link></div></article>
}
