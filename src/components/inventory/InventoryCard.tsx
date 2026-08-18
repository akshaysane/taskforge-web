import { Link } from 'react-router-dom'
import type { InventoryItem } from '../../api/inventory'
import LifecycleBadge from './LifecycleBadge'

export default function InventoryCard({ item }: { item: InventoryItem }) {
  return <article className="inventory-card">{item.media?.[0] ? <span className="inventory-photo" aria-label="Item photo">Photo attached</span> : null}<div><strong>{item.inventoryCode}</strong><span>{item.originalSet?.design.name ?? 'Inventory design'} · {item.pieceType?.name ?? 'Piece'}</span><span>{item.customSize || 'No size'} · {item.storageLocation || 'No location'}</span></div><LifecycleBadge status={item.lifecycleStatus} /><span>{item.lifecycleStatus === 'ACTIVE' ? 'Available' : 'Unavailable'}</span><Link className="button button-secondary" to={`/inventory/${item.inventoryCode}`}>View item</Link></article>
}
