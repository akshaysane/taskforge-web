import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiError, listDesigns, type Design } from '../api/designs'
import { createOriginalSet, listOriginalSets, type OriginalSetSummary } from '../api/original-sets'
import ErrorBanner from '../components/feedback/ErrorBanner'
import LoadingState from '../components/feedback/LoadingState'
import EmptyState from '../components/feedback/EmptyState'
import PageHeader from '../components/app/PageHeader'

function progress(set: OriginalSetSummary) { return set.onboarding?.progressPercent ?? 0 }

export default function OriginalSets() {
  const navigate = useNavigate()
  const location = useLocation()
  const [designs, setDesigns] = useState<Design[]>([])
  const [sets, setSets] = useState<OriginalSetSummary[]>([])
  const [designId, setDesignId] = useState(() => (location.state as { designId?: string } | null)?.designId ?? '')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => { let active = true; void Promise.all([listDesigns(), listOriginalSets()]).then(([nextDesigns, nextSets]) => { if (active) { setDesigns(nextDesigns.filter((design) => !design.archivedAt)); setSets(nextSets) } }).catch((reason: unknown) => { if (active) setError(apiError(reason).message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])
  const visible = useMemo(() => sets.filter((set) => (!designId || set.designId === designId) && (status === 'ALL' || (status === 'VERIFIED' ? Boolean(set.verifiedAt) : !set.verifiedAt))), [sets, designId, status])
  const designName = (set: OriginalSetSummary) => designs.find((design) => design.id === set.designId)?.name ?? 'Unknown design'

  async function createNext() {
    if (!designId) { setError('Choose an active design before onboarding a set.'); return }
    setCreating(true); setError('')
    try { const created = await createOriginalSet({ designId }); navigate(`/original-sets/${created.id}`) } catch (reason) { setError(apiError(reason).message) } finally { setCreating(false) }
  }
  if (loading) return <LoadingState label="Loading original sets" />
  return <><PageHeader title="Original sets" actions={<><label className="sr-only" htmlFor="onboard-design">Active design</label><select id="onboard-design" value={designId} onChange={(event) => setDesignId(event.target.value)}><option value="">Choose active design</option>{designs.map((design) => <option value={design.id} key={design.id}>{design.designCode} — {design.name}</option>)}</select><button type="button" className="button" disabled={creating} onClick={() => void createNext()}>{creating ? 'Creating…' : 'Onboard next set'}</button></>} />
    <section className="original-sets-page"><p className="page-copy">Manage original sets. Your tailor groupings stay preserved as you progress.</p>{error ? <ErrorBanner message={error} /> : null}
      <div className="onboarding-filters"><label>Design<select value={designId} onChange={(event) => setDesignId(event.target.value)}><option value="">All designs</option>{designs.map((design) => <option value={design.id} key={design.id}>{design.name}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All</option><option value="VERIFIED">Verified</option><option value="INCOMPLETE">Incomplete</option></select></label><button type="button" className="button button-secondary" onClick={() => { setDesignId(''); setStatus('ALL') }}>Reset</button></div>
      {visible.length === 0 ? <EmptyState title="No original sets" description="Onboard the next tailor set when an active design is ready." /> : <div className="data-table original-sets-table"><div className="table-header"><span>Design</span><span>Original set code</span><span>Items</span><span>Progress</span><span>Status</span><span>Action</span></div>{visible.map((set) => <div className="table-row" key={set.id}><span>{designName(set)}</span><strong>{set.originalSetCode}</strong><span>{set.onboarding?.generatedExpectedItemCount ?? set.inventoryItemCount} of {set.onboarding?.expectedItemCount ?? set.inventoryItemCount}</span><span className="set-progress"><b>{progress(set)}%</b><i><em style={{ width: `${progress(set)}%` }} /></i><small>{set.onboarding?.stage ?? 'PHOTO'}</small></span><span className={set.verifiedAt ? 'verified-badge' : 'incomplete-badge'}>{set.verifiedAt ? 'Verified' : 'Incomplete'}</span><button className={set.verifiedAt ? 'button button-secondary' : 'button'} type="button" aria-label={`${set.verifiedAt ? 'View' : 'Resume'} ${set.originalSetCode}`} onClick={() => navigate(`/original-sets/${set.id}`)}>{set.verifiedAt ? 'View' : 'Resume'}</button></div>)}</div>}</section></>
}
