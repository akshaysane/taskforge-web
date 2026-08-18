import { useEffect, useState, type ChangeEvent } from 'react'
import { apiError, type Design } from '../../api/designs'
import { listMeasurementDefinitions, type MeasurementDefinition, type PieceType } from '../../api/piece-types'

export interface InventoryMeasurementFilter { definitionId: string; min: string; max: string }
export interface InventoryFilterValues { designId: string; pieceTypeId: string; lifecycleStatus: string; condition: string; storageLocation: string; measurements: InventoryMeasurementFilter[] }
export default function InventoryFilters({ value, designs, pieceTypes, onChange, onReset }: { value: InventoryFilterValues; designs: Design[]; pieceTypes: PieceType[]; onChange: (next: InventoryFilterValues) => void; onReset: () => void }) {
  const [definitionResult, setDefinitionResult] = useState<{ requestKey: string; definitions: MeasurementDefinition[]; error: string }>({ requestKey: '', definitions: [], error: '' })
  const [retry, setRetry] = useState(0)
  const requestKey = `${value.pieceTypeId}:${retry}`

  useEffect(() => {
    if (!value.pieceTypeId) return
    let active = true
    void listMeasurementDefinitions(value.pieceTypeId).then((loaded) => {
      if (active) setDefinitionResult({ requestKey, definitions: loaded.filter((definition) => definition.active).sort((a, b) => a.sortOrder - b.sortOrder), error: '' })
    }).catch((reason: unknown) => { if (active) setDefinitionResult({ requestKey, definitions: [], error: apiError(reason).message }) })
    return () => { active = false }
  }, [requestKey, value.pieceTypeId])

  const definitionsCurrent = Boolean(value.pieceTypeId) && definitionResult.requestKey === requestKey
  const definitions = definitionsCurrent ? definitionResult.definitions : []
  const definitionsError = definitionsCurrent ? definitionResult.error : ''
  const definitionsLoading = Boolean(value.pieceTypeId) && !definitionsCurrent

  const change = (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    if (event.target.name === 'pieceTypeId') onChange({ ...value, pieceTypeId: event.target.value, measurements: [] })
    else onChange({ ...value, [event.target.name]: event.target.value })
  }
  const updateMeasurement = (index: number, patch: Partial<InventoryMeasurementFilter>) => onChange({ ...value, measurements: value.measurements.map((measurement, rowIndex) => rowIndex === index ? { ...measurement, ...patch } : measurement) })
  const unusedDefinition = definitions.find((definition) => !value.measurements.some((measurement) => measurement.definitionId === definition.id))

  return <section className="inventory-filters" aria-label="Inventory filters"><label>Design<select name="designId" value={value.designId} onChange={change}><option value="">All designs</option>{designs.map((design) => <option key={design.id} value={design.id}>{design.designCode} — {design.name}</option>)}</select></label><label>Piece type<select name="pieceTypeId" value={value.pieceTypeId} onChange={change}><option value="">All piece types</option>{pieceTypes.map((piece) => <option key={piece.id} value={piece.id}>{piece.code} — {piece.name}</option>)}</select></label><label>Lifecycle<select name="lifecycleStatus" value={value.lifecycleStatus} onChange={change}><option value="">All lifecycle states</option>{['ACTIVE', 'CLEANING', 'REPAIR_REQUIRED', 'ALTERATION_REQUIRED', 'MISSING', 'RETIRED'].map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label><label>Condition<select name="condition" value={value.condition} onChange={change}><option value="">All conditions</option>{['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'DAMAGED'].map((status) => <option key={status} value={status}>{status}</option>)}</select></label><label>Storage location<input name="storageLocation" value={value.storageLocation} onChange={change} /></label><fieldset className="measurement-filters"><legend>Measurements</legend>{value.measurements.map((measurement, index) => <div className="measurement-filter-row" key={`${measurement.definitionId}-${index}`}><label>Measurement definition<select value={measurement.definitionId} onChange={(event) => updateMeasurement(index, { definitionId: event.target.value })}><option value="">Choose measurement</option>{definitions.map((definition) => <option key={definition.id} value={definition.id}>{definition.label}</option>)}</select></label><label>Minimum measurement<input inputMode="decimal" value={measurement.min} onChange={(event) => updateMeasurement(index, { min: event.target.value })} /></label><label>Maximum measurement<input inputMode="decimal" value={measurement.max} onChange={(event) => updateMeasurement(index, { max: event.target.value })} /></label><button type="button" className="icon-button measurement-remove" aria-label="Remove measurement filter" onClick={() => onChange({ ...value, measurements: value.measurements.filter((_, rowIndex) => rowIndex !== index) })}>×</button></div>)}{definitionsError ? <div className="measurement-filter-error"><span className="field-error" role="alert">{definitionsError}</span><button type="button" className="button button-secondary" onClick={() => setRetry((attempt) => attempt + 1)}>Retry measurements</button></div> : <button type="button" className="button button-secondary measurement-add" disabled={!value.pieceTypeId || definitionsLoading || !unusedDefinition} onClick={() => unusedDefinition && onChange({ ...value, measurements: [...value.measurements, { definitionId: unusedDefinition.id, min: '', max: '' }] })}>{definitionsLoading ? 'Loading measurements…' : 'Add measurement filter'}</button>}</fieldset><button type="button" className="button button-secondary" onClick={onReset}>Clear filters</button></section>
}
