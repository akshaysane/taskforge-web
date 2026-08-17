import { useEffect, useState, type FormEvent } from 'react'
import { apiError } from '../api/designs'
import { createMeasurementDefinition, createPieceType, listMeasurementDefinitions, listPieceTypes, matchModeLabels, updateMeasurementDefinition, updatePieceType, type MeasurementDefinition, type MeasurementDefinitionInput, type PieceType, type PieceTypeInput } from '../api/piece-types'
import PageHeader from '../components/app/PageHeader'
import ErrorBanner from '../components/feedback/ErrorBanner'
import LoadingState from '../components/feedback/LoadingState'
import MeasurementFields from '../components/inventory/MeasurementFields'
import AccessibleSheet from '../components/overlay/AccessibleSheet'

const blankMeasurement = (sortOrder: number): MeasurementDefinitionInput => ({ code: '', label: '', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: '', defaultTolerance: '', requiredForItem: true, sortOrder })
const blankPieceType: PieceTypeInput = { code: '', name: '', description: '', sortOrder: 0 }

function definitionInput(definition: MeasurementDefinition): MeasurementDefinitionInput {
  return { code: definition.code, label: definition.label, unit: definition.unit, matchMode: definition.matchMode, matchingGroup: definition.matchingGroup, defaultTolerance: definition.defaultTolerance, requiredForItem: definition.requiredForItem, sortOrder: definition.sortOrder, active: definition.active }
}

export default function InventorySettings() {
  const [pieceTypes, setPieceTypes] = useState<PieceType[]>([])
  const [selected, setSelected] = useState<PieceType | null>(null)
  const [definitions, setDefinitions] = useState<MeasurementDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [definitionsLoading, setDefinitionsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pieceTypeForm, setPieceTypeForm] = useState<PieceTypeInput | null>(null)
  const [editingPieceType, setEditingPieceType] = useState<PieceType | null>(null)
  const [measurementForm, setMeasurementForm] = useState<{ original: MeasurementDefinition | null; value: MeasurementDefinitionInput } | null>(null)
  const [pendingDiscard, setPendingDiscard] = useState<{ piece?: PieceType; closeEditor?: boolean } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    void listPieceTypes().then((loaded) => {
      if (!active) return
      setPieceTypes(loaded)
      setSelected(loaded[0] ?? null)
    }).catch((requestError: unknown) => { if (active) setError(apiError(requestError).message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const selectedId = selected?.id
  useEffect(() => {
    if (!selectedId) { setDefinitions([]); return }
    let active = true
    setDefinitionsLoading(true)
    void listMeasurementDefinitions(selectedId).then((loaded) => { if (active) setDefinitions(loaded) }).catch((requestError: unknown) => { if (active) setError(apiError(requestError).message) }).finally(() => { if (active) setDefinitionsLoading(false) })
    return () => { active = false }
  }, [selectedId])

  useEffect(() => {
    if (!measurementForm) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [measurementForm])

  function selectPiece(piece: PieceType) {
    if (measurementForm) { setPendingDiscard({ piece }); return }
    setSelected(piece)
  }

  function closeMeasurementEditor() {
    if (measurementForm) setPendingDiscard({ closeEditor: true })
  }

  async function savePieceType(event: FormEvent) {
    event.preventDefault()
    if (!pieceTypeForm) return
    setSaving(true); setError(''); setFieldErrors({})
    try {
      const saved = editingPieceType ? await updatePieceType(editingPieceType.id, pieceTypeForm) : await createPieceType(pieceTypeForm)
      setPieceTypes((current) => editingPieceType ? current.map((piece) => piece.id === saved.id ? saved : piece) : [...current, saved].sort((left, right) => left.sortOrder - right.sortOrder))
      if (selected?.id === saved.id) setSelected(saved)
      setPieceTypeForm(null)
      setEditingPieceType(null)
    } catch (requestError) {
      const parsed = apiError(requestError); setError(parsed.message); setFieldErrors(parsed.fieldErrors)
    } finally { setSaving(false) }
  }

  async function saveMeasurement(event: FormEvent) {
    event.preventDefault()
    if (!measurementForm || !selected) return
    setSaving(true); setError(''); setFieldErrors({})
    try {
      const saved = measurementForm.original
        ? await updateMeasurementDefinition(measurementForm.original.id, measurementForm.value)
        : await createMeasurementDefinition(selected.id, measurementForm.value)
      setDefinitions((current) => measurementForm.original ? current.map((definition) => definition.id === saved.id ? saved : definition) : [...current, saved].sort((left, right) => left.sortOrder - right.sortOrder))
      setMeasurementForm(null)
    } catch (requestError) {
      const parsed = apiError(requestError); setError(parsed.message); setFieldErrors(parsed.fieldErrors)
    } finally { setSaving(false) }
  }

  if (loading) return <LoadingState label="Loading inventory configuration" />
  return <><PageHeader title="Configuration" />
    <section className="config-page configuration-page"><div className="page-intro"><p>Manage piece types and measurement definitions.</p></div>{error ? <ErrorBanner message={error} /> : null}
      <div className="configuration-layout"><section className="piece-types-panel"><div className="section-heading"><div><h2>Piece types</h2><p>Ordered inventory components.</p></div><div className="section-actions">{selected ? <button className="button button-secondary" onClick={() => { setEditingPieceType(selected); setPieceTypeForm({ code: selected.code, name: selected.name, description: selected.description ?? '', sortOrder: selected.sortOrder, active: selected.active }) }}>Edit piece type</button> : null}<button className="button" onClick={() => { setEditingPieceType(null); setPieceTypeForm(blankPieceType) }}>Add piece type</button></div></div>
        <div className="piece-type-list">{pieceTypes.map((piece) => <button key={piece.id} className={`piece-type-card${selected?.id === piece.id ? ' selected' : ''}`} onClick={() => selectPiece(piece)}><strong>{piece.code}</strong><span>{piece.name}</span><small>{piece.active ? 'Active' : 'Inactive'}</small></button>)}</div>
      </section>
      <section className="measurements-panel"><div className="section-heading"><div><h2>Measurements</h2><p>{selected ? `Manage definitions for ${selected.name}.` : 'Select a piece type.'}</p></div>{selected ? <button className="button" onClick={() => setMeasurementForm({ original: null, value: blankMeasurement(definitions.length) })}>Add measurement</button> : null}</div>
        {definitionsLoading ? <LoadingState label="Loading measurements" /> : <div className="data-table measurement-table"><div className="table-header"><span>Label</span><span>Match mode</span><span>Group</span><span>Tolerance</span><span>Required</span><span>Order</span><span>Actions</span></div>{definitions.map((definition) => <article className="table-row" key={definition.id}><span>{definition.label}</span><span>{matchModeLabels[definition.matchMode]}</span><span>{definition.matchingGroup || '—'}</span><span>{definition.defaultTolerance ?? '—'}</span><span>{definition.requiredForItem ? 'Required' : 'Optional'}</span><span>{definition.sortOrder}</span><button className="icon-button" onClick={() => setMeasurementForm({ original: definition, value: definitionInput(definition) })} aria-label={`Edit ${definition.label}`}>Edit</button></article>)}{selected && definitions.length === 0 ? <p className="empty-table">No measurements configured.</p> : null}</div>}</section></div>
    </section>
    {pieceTypeForm ? <AccessibleSheet label="Piece type editor" onRequestClose={() => setPieceTypeForm(null)}><div className="editor-heading"><h1>{editingPieceType ? 'Edit piece type' : 'Add piece type'}</h1><button data-initial-focus className="icon-button" onClick={() => setPieceTypeForm(null)} aria-label="Close piece type editor">×</button></div><form className="editor-form" onSubmit={savePieceType}><div className="editor-fields"><label>Piece type code<input value={pieceTypeForm.code} readOnly={Boolean(editingPieceType)} onChange={(event) => setPieceTypeForm({ ...pieceTypeForm, code: event.target.value })} />{editingPieceType ? <small>Referenced codes are locked.</small> : null}{fieldErrors.code ? <span className="field-error">{fieldErrors.code}</span> : null}</label><label>Name<input value={pieceTypeForm.name} onChange={(event) => setPieceTypeForm({ ...pieceTypeForm, name: event.target.value })} /></label><label>Description<textarea value={pieceTypeForm.description ?? ''} onChange={(event) => setPieceTypeForm({ ...pieceTypeForm, description: event.target.value })} /></label><label>Display order<input type="number" min="0" value={pieceTypeForm.sortOrder ?? 0} onChange={(event) => setPieceTypeForm({ ...pieceTypeForm, sortOrder: Number(event.target.value) })} /></label><label className="check-field"><input type="checkbox" checked={pieceTypeForm.active ?? true} onChange={(event) => setPieceTypeForm({ ...pieceTypeForm, active: event.target.checked })} /> Active</label></div><div className="editor-actions"><button className="button button-secondary" type="button" onClick={() => setPieceTypeForm(null)}>Cancel</button><button className="button" disabled={saving}>Save piece type</button></div></form></AccessibleSheet> : null}
    {measurementForm ? <AccessibleSheet label="Measurement editor" onRequestClose={closeMeasurementEditor}><div className="editor-heading"><div><h1>{measurementForm.original ? 'Edit measurement' : 'Add measurement'}</h1><p>Measurements use inches.</p></div><button data-initial-focus className="icon-button" onClick={closeMeasurementEditor} aria-label="Close measurement editor">×</button></div><form className="editor-form" onSubmit={saveMeasurement}><MeasurementFields value={measurementForm.value} lockedCode={Boolean(measurementForm.original)} onChange={(value) => setMeasurementForm({ ...measurementForm, value })} fieldErrors={fieldErrors} /><div className="editor-actions"><button className="button button-secondary" type="button" onClick={closeMeasurementEditor}>Cancel</button><button className="button" disabled={saving}>Save measurement</button></div></form></AccessibleSheet> : null}
    {pendingDiscard ? <AccessibleSheet label="Discard unsaved measurement" className="confirm-dialog" onRequestClose={() => setPendingDiscard(null)}><h2>Discard unsaved measurement?</h2><p>Your changes have not been saved.</p><div className="editor-actions"><button data-initial-focus className="button button-secondary" onClick={() => setPendingDiscard(null)}>Keep editing</button><button className="button" onClick={() => { setMeasurementForm(null); if (pendingDiscard.piece) setSelected(pendingDiscard.piece); setPendingDiscard(null) }}>Discard changes</button></div></AccessibleSheet> : null}
  </>
}
