import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiError, listDesigns, type Design } from '../api/designs'
import { listInventoryItems, type InventoryItem } from '../api/inventory'
import { listPieceTypes, type PieceType } from '../api/piece-types'
import InventoryCard from '../components/inventory/InventoryCard'
import InventoryFilters, { type InventoryFilterValues } from '../components/inventory/InventoryFilters'
import PageHeader from '../components/app/PageHeader'
import EmptyState from '../components/feedback/EmptyState'
import ErrorBanner from '../components/feedback/ErrorBanner'
import LoadingState from '../components/feedback/LoadingState'

const filterKeys = ['designId', 'pieceTypeId', 'lifecycleStatus', 'condition', 'storageLocation'] as const
function valuesFrom(params: URLSearchParams): InventoryFilterValues { const [measurementDefinitionId = '', measurementMin = '', measurementMax = ''] = (params.get('measurement') ?? '||').split('|'); return { designId: params.get('designId') ?? '', pieceTypeId: params.get('pieceTypeId') ?? '', lifecycleStatus: params.get('lifecycleStatus') ?? '', condition: params.get('condition') ?? '', storageLocation: params.get('storageLocation') ?? '', measurementDefinitionId, measurementMin, measurementMax } }

export default function InventoryList() {
  const [params, setParams] = useSearchParams()
  const [draftQuery, setDraftQuery] = useState(() => params.get('query') ?? '')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [designs, setDesigns] = useState<Design[]>([])
  const [pieceTypes, setPieceTypes] = useState<PieceType[]>([])
  const serialized = params.toString()
  const filters = useMemo(() => valuesFrom(new URLSearchParams(serialized)), [serialized])

  useEffect(() => { let active = true; void Promise.all([listDesigns(), listPieceTypes()]).then(([nextDesigns, nextPieceTypes]) => { if (active) { setDesigns(nextDesigns.filter((design) => !design.archivedAt)); setPieceTypes(nextPieceTypes.filter((piece) => piece.active)) } }).catch(() => undefined); return () => { active = false } }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(serialized)
      if (draftQuery.trim()) next.set('query', draftQuery.trim())
      else next.delete('query')
      next.delete('cursor')
      if (next.toString() !== serialized) setParams(next, { replace: true })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [draftQuery, serialized, setParams])

  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    const query = Object.fromEntries(new URLSearchParams(serialized).entries()) as Record<string, string>
    void listInventoryItems({ ...query, limit: 25 }).then((result) => {
      if (active) { setItems(result.items); setNextCursor(result.nextCursor) }
    }).catch((reason: unknown) => { if (active) setError(apiError(reason).message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [serialized])

  function updateFilters(nextFilters: InventoryFilterValues) {
    const next = new URLSearchParams(params)
    filterKeys.forEach((key) => nextFilters[key] ? next.set(key, nextFilters[key]) : next.delete(key))
    const hasMeasurement = nextFilters.measurementDefinitionId || nextFilters.measurementMin || nextFilters.measurementMax
    if (hasMeasurement && nextFilters.measurementDefinitionId) next.set('measurement', `${nextFilters.measurementDefinitionId}|${nextFilters.measurementMin}|${nextFilters.measurementMax}`)
    else next.delete('measurement')
    next.delete('cursor'); setParams(next)
  }
  function clearFilters() { setDraftQuery(''); setParams(new URLSearchParams()) }
  async function loadMore() {
    if (!nextCursor) return
    setLoadingMore(true)
    try { const query = Object.fromEntries(params.entries()) as Record<string, string>; const result = await listInventoryItems({ ...query, cursor: nextCursor, limit: 25 }); setItems((current) => [...current, ...result.items]); setNextCursor(result.nextCursor) } catch (reason) { setError(apiError(reason).message) } finally { setLoadingMore(false) }
  }

  return <><PageHeader title="Inventory" actions={<><label className="search-field"><span className="sr-only">Search inventory</span><input type="search" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Search code" /></label><Link className="button" to="/inventory/new">Add inventory</Link></>} />
    <section className="inventory-page"><InventoryFilters value={filters} designs={designs} pieceTypes={pieceTypes} onChange={updateFilters} onReset={clearFilters} />{error ? <ErrorBanner message={error} /> : null}{loading ? <LoadingState label="Loading inventory" /> : items.length === 0 ? <EmptyState title="No inventory items" description="Try clearing filters or add an item to an original set." /> : <div className="inventory-list">{items.map((item) => <InventoryCard key={item.id} item={item} />)}</div>}{nextCursor ? <button className="button button-secondary" type="button" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? 'Loading…' : 'Load more'}</button> : null}</section></>
}
