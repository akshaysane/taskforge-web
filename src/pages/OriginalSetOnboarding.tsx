import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { apiError } from '../api/designs'
import { getInventoryItemByCode, recordLabelPrinted, updateInventoryItem, verifyInventoryLabel, type InventoryItem } from '../api/inventory'
import { generateExpectedItems, getOriginalSet, verifyOriginalSet, type OnboardingStage, type OriginalSetDetail } from '../api/original-sets'
import type { MediaLink } from '../api/media'
import PhotoGallery from '../components/media/PhotoGallery'
import PhotoUploader from '../components/media/PhotoUploader'
import QrLabel from '../components/qr/QrLabel'
import QrScanner from '../components/qr/QrScanner'
import ErrorBanner from '../components/feedback/ErrorBanner'
import LoadingState from '../components/feedback/LoadingState'
import { parseInventoryQrPayload } from '../lib/qr'

const stages: OnboardingStage[] = ['SET', 'PHOTO', 'PIECES', 'LABELS', 'VERIFY']
const stageLabels: Record<OnboardingStage, string> = { SET: 'Set', PHOTO: 'Photo', PIECES: 'Pieces', LABELS: 'Labels', VERIFY: 'Verify' }

type Draft = { measurements: Record<string, string>; customSize: string; storageLocation: string; notes: string; condition: string }
function draftFor(item: InventoryItem): Draft { return { measurements: Object.fromEntries(item.measurements.map((measurement) => [measurement.measurementDefinitionId, measurement.value])), customSize: item.customSize ?? '', storageLocation: item.storageLocation ?? '', notes: item.notes ?? '', condition: item.condition } }
function expectedIdentity(pieceTypeId: string, pieceSequence: number) { return `${pieceTypeId}:${pieceSequence}` }
function expectedIdentitySet(detail: OriginalSetDetail): Set<string> {
  return new Set(detail.design.pieceRequirements.filter((requirement) => requirement.required).flatMap((requirement) => Array.from({ length: requirement.quantity }, (_, index) => expectedIdentity(requirement.pieceTypeId, index + 1))))
}
function expectedItems(detail: OriginalSetDetail) {
  const expected = expectedIdentitySet(detail)
  return detail.inventoryItems.filter((item) => expected.has(expectedIdentity(item.pieceTypeId, item.pieceSequence)))
}
function activeItems(detail: OriginalSetDetail) { return detail.inventoryItems }
function requiredDefinitions(item: InventoryItem) {
  const detailedItem = item as OriginalSetDetail['inventoryItems'][number]
  return detailedItem.pieceType.measurementDefinitions.filter((definition) => definition.requiredForItem)
}
function pieceComplete(_detail: OriginalSetDetail, item: InventoryItem) {
  return requiredDefinitions(item).every((definition) => item.measurements.some((measurement) => measurement.measurementDefinitionId === definition.id))
}
function deriveStage(detail: OriginalSetDetail): OnboardingStage {
  const referencePhoto = detail.media.some((photo) => photo.purpose === 'REFERENCE' && photo.mediaAsset.uploadStatus === 'READY')
  if (!referencePhoto) return 'PHOTO'
  const expected = expectedIdentitySet(detail)
  const requiredItems = expectedItems(detail)
  const items = activeItems(detail)
  if (requiredItems.length !== expected.size) return 'PIECES'
  const measurementsComplete = items.every((item) => pieceComplete(detail, item))
  if (!measurementsComplete) return 'PIECES'
  if (!items.every((item) => item.labelVerified)) return 'LABELS'
  return 'VERIFY'
}

function completedPieceCount(detail: OriginalSetDetail) {
  return activeItems(detail).filter((item) => pieceComplete(detail, item)).length
}

export default function OriginalSetOnboarding() {
  const { originalSetId = '' } = useParams()
  const navigate = useNavigate()
  const [query, setQuery] = useSearchParams()
  const [detail, setDetail] = useState<OriginalSetDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [dirty, setDirty] = useState<Record<string, boolean>>({})
  const [scanMessage, setScanMessage] = useState('')
  const [printing, setPrinting] = useState(false)
  const [readyLabelIds, setReadyLabelIds] = useState<Set<string>>(new Set())
  const [activePieceId, setActivePieceId] = useState('')

  const hasDirtyDraft = Object.values(dirty).some(Boolean)
  const dirtyRef = useRef(false)
  dirtyRef.current = hasDirtyDraft
  useEffect(() => {
    const message = 'You have unsaved piece changes. Leave this set?'
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirtyRef.current) { event.preventDefault(); event.returnValue = 'Unsaved piece changes' } }
    const click = (event: MouseEvent) => { const anchor = (event.target as Element | null)?.closest('a[href]') as HTMLAnchorElement | null; if (dirtyRef.current && anchor && anchor.origin === window.location.origin && !window.confirm(message)) event.preventDefault() }
    const popstate = () => { if (dirtyRef.current && !window.confirm(message)) window.history.go(1) }
    window.addEventListener('beforeunload', beforeUnload)
    document.addEventListener('click', click, true)
    window.addEventListener('popstate', popstate)
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('click', click, true); window.removeEventListener('popstate', popstate) }
  }, [])

  const refresh = async () => { const next = await getOriginalSet(originalSetId); setDetail(next); setDrafts((current) => Object.fromEntries(next.inventoryItems.map((item) => [item.id, current[item.id] ?? draftFor(item)]))) }
  useEffect(() => { let active = true; void getOriginalSet(originalSetId).then((next) => { if (!active) return; setDetail(next); setDrafts(Object.fromEntries(next.inventoryItems.map((item) => [item.id, draftFor(item)]))) }).catch((reason: unknown) => { if (active) setError(apiError(reason).message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [originalSetId])
  const serverStage = detail ? deriveStage(detail) : 'SET'
  const requested = query.get('step') as OnboardingStage | null
  const activeStage = requested && stages.includes(requested) && stages.indexOf(requested) <= stages.indexOf(serverStage) ? requested : serverStage
  const expectedCount = detail ? expectedIdentitySet(detail).size : 0
  const generatedExpectedItems = detail ? expectedItems(detail) : []
  const currentItems = detail ? activeItems(detail) : []
  const editablePieceId = activePieceId || currentItems.find((item) => !pieceComplete(detail!, item))?.id || currentItems[0]?.id
  const photos = detail?.media.filter((photo) => photo.purpose === 'REFERENCE') ?? []
  const setLabelReady = useCallback((inventoryItemId: string, ready: boolean) => setReadyLabelIds((current) => { const next = new Set(current); if (ready) next.add(inventoryItemId); else next.delete(inventoryItemId); return next }), [])
  const labelsReady = currentItems.length > 0 && currentItems.every((item) => readyLabelIds.has(item.id))

  function showStage(stage: OnboardingStage) { if (stages.indexOf(stage) <= stages.indexOf(serverStage)) setQuery({ step: stage }) }
  function changeDraft(itemId: string, patch: Partial<Draft>) { setDrafts((current) => ({ ...current, [itemId]: { ...current[itemId], ...patch } })); setDirty((current) => ({ ...current, [itemId]: true })) }
  async function generate() { setError(''); try { await generateExpectedItems(originalSetId); await refresh() } catch (reason) { setError(apiError(reason).message) } }
  async function savePiece(item: InventoryItem) {
    const draft = drafts[item.id]; if (!draft) return
    setSaving((current) => ({ ...current, [item.id]: true })); setError('')
    try { await updateInventoryItem(item.id, { version: item.version, customSize: draft.customSize || null, storageLocation: draft.storageLocation || null, notes: draft.notes || null, condition: draft.condition, measurements: Object.entries(draft.measurements).filter(([, value]) => value.trim()).map(([measurementDefinitionId, value]) => ({ measurementDefinitionId, value })) }); setDirty((current) => ({ ...current, [item.id]: false })); await refresh() } catch (reason) {
      const source = reason as { response?: { data?: { code?: string } } }
      if (source.response?.data?.code === 'INVENTORY_VERSION_CONFLICT') {
        try { await refresh(); setError('This piece was updated elsewhere. The latest version was loaded; review your unsaved values and retry.') } catch { setError('This piece was updated elsewhere. Refresh the set, then retry your unsaved values.') }
      } else setError(apiError(reason).message)
    } finally { setSaving((current) => ({ ...current, [item.id]: false })) }
  }
  async function scan(rawCode: string) {
    setScanMessage(''); setError('')
    if (!detail) return false
    const parsed = parseInventoryQrPayload(rawCode, window.location.origin)
    if (!parsed.ok) { setError(parsed.reason === 'UNTRUSTED_ORIGIN' ? 'This label is not from this inventory.' : 'Enter a valid inventory label code.'); return false }
    try {
      const item = await getInventoryItemByCode(parsed.inventoryCode)
      if (item.originalSetId !== detail.id) { setError('This label belongs to another original set.'); return false }
      const outcome = await verifyInventoryLabel(parsed.inventoryCode)
      setScanMessage(outcome.alreadyVerified ? 'Already verified' : 'Label verified'); await refresh(); return true
    } catch (reason) { setError(apiError(reason).message); return false }
  }
  async function printFullSheet() {
    setError(''); setPrinting(true)
    if (!detail) { setPrinting(false); return }
    try { await Promise.all(activeItems(detail).map((item) => recordLabelPrinted(item.id))); window.print() } catch (reason) { setError(`Unable to record label printing. ${apiError(reason).message}`) } finally { setPrinting(false) }
  }
  async function verify() { setError(''); try { await verifyOriginalSet(originalSetId); await refresh() } catch (reason) { const parsed = apiError(reason); const source = reason as { response?: { data?: { blockers?: string[] } } }; const blockers = source.response?.data?.blockers; setError(blockers?.length ? `Incomplete: ${blockers.map((blocker) => blocker.replaceAll('_', ' ').toLowerCase()).join(', ')}` : parsed.message) } }
  const setPhotos = (next: MediaLink[]) => { if (detail) setDetail({ ...detail, media: [...detail.media.filter((photo) => photo.purpose !== 'REFERENCE'), ...next] }) }
  const title = detail ? `Original set ${detail.originalSetCode}` : 'Original set'
  function backToList() { if (hasDirtyDraft && !window.confirm('You have unsaved piece changes. Leave this set?')) return; navigate('/original-sets') }

  if (loading) return <LoadingState label="Loading original set" />
  if (!detail) return <main className="onboarding-page"><ErrorBanner message={error || 'Original set not found.'} /></main>
  return <main className="onboarding-page"><header className="onboarding-heading"><div><h1>{title}</h1><p>{detail.design.name}</p></div><span className={detail.verifiedAt ? 'verified-badge' : 'incomplete-badge'}>{detail.verifiedAt ? 'Verified' : 'In progress'}</span></header>
    <ol className="onboarding-progress" aria-label="Onboarding progress">{stages.map((stage, index) => <li key={stage} className={stage === activeStage ? 'active' : stages.indexOf(stage) < stages.indexOf(serverStage) ? 'complete' : ''}><button type="button" onClick={() => showStage(stage)} disabled={stages.indexOf(stage) > stages.indexOf(serverStage)}><b>{index + 1}</b><span>{stageLabels[stage]}</span></button></li>)}</ol>
    {error ? <ErrorBanner message={error} /> : null}
    {activeStage === 'SET' ? <section className="onboarding-step"><h2>Set details</h2><dl><div><dt>Original set code</dt><dd>{detail.originalSetCode}</dd></div><div><dt>Design lineage</dt><dd>{detail.design.designCode} — {detail.design.name}</dd></div><div><dt>Notes</dt><dd>{detail.notes || 'No notes'}</dd></div></dl></section> : null}
    {activeStage === 'PHOTO' ? <section className="onboarding-step"><h2>Reference photo</h2><p>Add at least one READY reference photo for this original tailor set.</p>{!detail.verifiedAt ? <PhotoUploader ownerType="original-set" ownerId={detail.id} purpose="REFERENCE" maxPhotos={12} existingPhotos={photos} onChange={setPhotos} /> : null}<PhotoGallery photos={photos} ownerType="original-set" ownerId={detail.id} onChange={setPhotos} readOnly={Boolean(detail.verifiedAt)} /></section> : null}
    {activeStage === 'PIECES' ? <section className="onboarding-step"><div className="step-title"><div><h2>Pieces</h2><p>{completedPieceCount(detail)} of {currentItems.length} active pieces complete</p></div>{generatedExpectedItems.length < expectedCount ? <button className="button" type="button" onClick={() => void generate()}>Generate expected pieces</button> : null}</div>{currentItems.map((item) => { const definitions = item.pieceType.measurementDefinitions; const draft = drafts[item.id] ?? draftFor(item); const editing = editablePieceId === item.id; const unexpected = !expectedIdentitySet(detail).has(expectedIdentity(item.pieceTypeId, item.pieceSequence)); return <article className="piece-entry" key={item.id}><h3>{item.pieceType.name}</h3><p>{item.inventoryCode} · {unexpected ? 'Added item · ' : ''}{pieceComplete(detail, item) ? 'Complete' : item.measurements.length ? 'In progress' : 'Not started'}</p><button className="button button-secondary" type="button" aria-expanded={editing} onClick={() => setActivePieceId(item.id)}>Edit {item.pieceType.name}</button>{editing ? <><div className="piece-fields">{definitions.map((definition) => <label key={definition.id}>{definition.label} ({definition.unit.toLowerCase()}){definition.requiredForItem ? <strong> Required</strong> : null}<input aria-label={definition.label} inputMode="decimal" value={draft.measurements[definition.id] ?? ''} onChange={(event) => changeDraft(item.id, { measurements: { ...draft.measurements, [definition.id]: event.target.value } })} /></label>)}<label>Custom size<input value={draft.customSize} onChange={(event) => changeDraft(item.id, { customSize: event.target.value })} /></label><label>Storage location<input value={draft.storageLocation} onChange={(event) => changeDraft(item.id, { storageLocation: event.target.value })} /></label></div><button className="button" type="button" disabled={saving[item.id]} onClick={() => void savePiece(item)}>{saving[item.id] ? 'Saving…' : `Save ${item.pieceType.name}`}</button></> : null}</article> })}</section> : null}
    {activeStage === 'LABELS' ? <section className="onboarding-step"><h2>Labels</h2><p>Print each label, then verify it by scanning or entering its code.</p><button type="button" className="button button-secondary" disabled={printing || !labelsReady} onClick={() => void printFullSheet()}>{printing ? 'Recording labels…' : labelsReady ? 'Print full sheet' : 'Preparing labels…'}</button><div className="onboarding-labels print-sheet">{currentItems.map((item) => <article key={item.id}><QrLabel inventoryItemId={item.id} inventoryCode={item.inventoryCode} designName={detail.design.name} pieceName={item.pieceType.name} onReadinessChange={setLabelReady} /><p className={item.labelVerified ? 'verified-badge' : 'incomplete-badge'}>{item.labelVerified ? 'Label verified' : 'Awaiting scan'}</p></article>)}</div><QrScanner onScan={scan} manualLabel="Manual code" submitLabel="Verify label" />{scanMessage ? <p role="status">{scanMessage}</p> : null}</section> : null}
    {activeStage === 'VERIFY' ? <section className="onboarding-step"><h2>Verify original set</h2><ul className="verification-list"><li>{generatedExpectedItems.length === expectedCount ? 'Expected items complete' : 'Expected items missing'}</li><li>{photos.length ? 'Reference photo attached' : 'Reference photo missing'}</li><li>{completedPieceCount(detail) === currentItems.length ? 'Required measurements complete' : 'Required measurements missing'}</li><li>{currentItems.every((item) => item.labelVerified) ? 'All labels scanned' : 'Label scans remaining'}</li></ul>{detail.verifiedAt ? <p role="status">Original set verified</p> : <button type="button" className="button" onClick={() => void verify()}>Verify original set</button>}</section> : null}
    <footer className="onboarding-actions"><button className="button button-secondary" type="button" onClick={backToList}>Back</button>{activeStage !== 'VERIFY' ? <button className="button" type="button" onClick={() => showStage(stages[Math.min(stages.indexOf(activeStage) + 1, stages.length - 1)])}>Save and continue</button> : null}</footer>
  </main>
}
