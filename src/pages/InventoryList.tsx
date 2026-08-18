import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiError, listDesigns, type Design } from '../api/designs'
import { listInventoryItems, type InventoryItem, type InventorySearchParams } from '../api/inventory'
import { listPieceTypes, type PieceType } from '../api/piece-types'
import InventoryCard from '../components/inventory/InventoryCard'
import InventoryFilters, { type InventoryFilterValues } from '../components/inventory/InventoryFilters'
import PageHeader from '../components/app/PageHeader'
import EmptyState from '../components/feedback/EmptyState'
import ErrorBanner from '../components/feedback/ErrorBanner'
import LoadingState from '../components/feedback/LoadingState'

const filterKeys = ['designId', 'pieceTypeId', 'lifecycleStatus', 'condition', 'storageLocation'] as const
const searchKeys = ['query', 'designId', 'primaryColor', 'secondaryColor', 'pieceTypeId', 'originalSetId', 'lifecycleStatus', 'availability', 'condition', 'customSize', 'storageLocation', 'cursor'] as const

function valuesFrom(params: URLSearchParams): InventoryFilterValues {
  return {
    designId: params.get('designId') ?? '',
    pieceTypeId: params.get('pieceTypeId') ?? '',
    lifecycleStatus: params.get('lifecycleStatus') ?? '',
    condition: params.get('condition') ?? '',
    storageLocation: params.get('storageLocation') ?? '',
    measurements: params.getAll('measurement').map((serializedMeasurement) => {
      const [definitionId = '', min = '', max = ''] = serializedMeasurement.split('|')
      return { definitionId, min, max }
    }).filter((measurement) => measurement.definitionId),
  }
}

function inventorySearchFrom(params: URLSearchParams): InventorySearchParams {
  const query: InventorySearchParams = {}
  searchKeys.forEach((key) => {
    const value = params.get(key)
    if (value) Object.assign(query, { [key]: value })
  })
  const measurements = params.getAll('measurement').filter(Boolean)
  if (measurements.length) query.measurement = measurements
  return query
}

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
  const urlQuery = params.get('query') ?? ''
  const latestSerialized = useRef(serialized)
  latestSerialized.current = serialized
  const filters = useMemo(() => valuesFrom(new URLSearchParams(serialized)), [serialized])

  useEffect(() => { let active = true; void Promise.all([listDesigns(), listPieceTypes()]).then(([nextDesigns, nextPieceTypes]) => { if (active) { setDesigns(nextDesigns.filter((design) => !design.archivedAt)); setPieceTypes(nextPieceTypes.filter((piece) => piece.active)) } }).catch(() => undefined); return () => { active = false } }, [])

  useEffect(() => {
    setDraftQuery((current) => current === urlQuery ? current : urlQuery)
  }, [urlQuery])

  useEffect(() => {
    if (draftQuery === urlQuery) return
    const startingUrl = serialized
    const timer = window.setTimeout(() => {
      if (latestSerialized.current !== startingUrl) return
      const next = new URLSearchParams(startingUrl)
      if (draftQuery.trim()) next.set('query', draftQuery.trim())
      else next.delete('query')
      next.delete('cursor')
      if (next.toString() !== startingUrl) setParams(next, { replace: true })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [draftQuery, serialized, setParams, urlQuery])

  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    const query = inventorySearchFrom(new URLSearchParams(serialized))
    void listInventoryItems({ ...query, limit: 25 }).then((result) => {
      if (active) { setItems(result.items); setNextCursor(result.nextCursor) }
    }).catch((reason: unknown) => { if (active) setError(apiError(reason).message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [serialized])

  function updateFilters(nextFilters: InventoryFilterValues) {
    const next = new URLSearchParams(params)
    filterKeys.forEach((key) => nextFilters[key] ? next.set(key, nextFilters[key]) : next.delete(key))
    next.delete('measurement')
    nextFilters.measurements.forEach(({ definitionId, min, max }) => {
      if (definitionId) next.append('measurement', `${definitionId}|${min}|${max}`)
    })
    next.delete('cursor'); setParams(next)
  }
  function clearFilters() { setDraftQuery(''); setParams(new URLSearchParams()) }
  async function loadMore() {
    if (!nextCursor) return
    setLoadingMore(true)
    try { const query = inventorySearchFrom(params); const result = await listInventoryItems({ ...query, cursor: nextCursor, limit: 25 }); setItems((current) => [...current, ...result.items]); setNextCursor(result.nextCursor) } catch (reason) { setError(apiError(reason).message) } finally { setLoadingMore(false) }
  }

  return <><PageHeader title="Inventory" actions={<><label className="search-field"><span className="sr-only">Search inventory</span><input type="search" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Search code" /></label><Link className="button" to="/inventory/new">Add inventory</Link></>} />
    <section className="inventory-page"><InventoryFilters value={filters} designs={designs} pieceTypes={pieceTypes} onChange={updateFilters} onReset={clearFilters} />{error ? <ErrorBanner message={error} /> : loading ? <LoadingState label="Loading inventory" /> : items.length === 0 ? <EmptyState title="No inventory items" description="Try clearing filters or add an item to an original set." /> : <div className="inventory-list">{items.map((item) => <InventoryCard key={item.id} item={item} />)}</div>}{!error && nextCursor ? <button className="button button-secondary" type="button" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? 'Loading…' : 'Load more'}</button> : null}</section></>
}
