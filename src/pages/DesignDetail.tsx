import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiError, createDesign, getDesign, replaceDesignRequirements, updateDesign, type Design, type DesignInput, type DesignPieceRequirement } from '../api/designs'
import { listPieceTypes, type PieceType } from '../api/piece-types'
import ErrorBanner from '../components/feedback/ErrorBanner'
import LoadingState from '../components/feedback/LoadingState'
import AccessibleSheet from '../components/overlay/AccessibleSheet'
import PhotoGallery from '../components/media/PhotoGallery'
import PhotoUploader from '../components/media/PhotoUploader'
import type { MediaLink } from '../api/media'

const blankDesign: DesignInput = { designCode: '', name: '', costumeType: '', primaryColor: '', secondaryColor: '', description: '' }
const codeChangeWarning = 'Changing this Design Code will also update the generated Original Set and Inventory codes associated with this design. Existing database relationships and rental history will remain unchanged.'

interface DesignDetailProps { designId?: string; onSaved?: (design: Design) => void; onClose?: () => void }

function inputFromDesign(design: Design): DesignInput {
  return { designCode: design.designCode, name: design.name, costumeType: design.costumeType, primaryColor: design.primaryColor, secondaryColor: design.secondaryColor, description: design.description }
}

function rowFromPiece(piece: PieceType, sortOrder: number): DesignPieceRequirement {
  return { pieceTypeId: piece.id, pieceType: { id: piece.id, code: piece.code, name: piece.name }, quantity: 1, required: true, sortOrder }
}

export default function DesignDetail({ designId: suppliedId, onSaved, onClose }: DesignDetailProps) {
  const params = useParams()
  const navigate = useNavigate()
  const designId = suppliedId ?? params.designId
  const [design, setDesign] = useState<Design | null>(null)
  const [input, setInput] = useState<DesignInput>(blankDesign)
  const [requirements, setRequirements] = useState<DesignPieceRequirement[]>([])
  const [pieceTypes, setPieceTypes] = useState<PieceType[]>([])
  const [loading, setLoading] = useState(Boolean(designId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<MediaLink[]>([])
  const [confirmingCodeChange, setConfirmingCodeChange] = useState(false)

  useEffect(() => {
    let active = true
    const requests = [listPieceTypes(), designId ? getDesign(designId) : Promise.resolve(null)] as const
    void Promise.all(requests).then(([types, loaded]) => {
      if (!active) return
      setPieceTypes(types.filter((type) => type.active))
      if (loaded) {
        setDesign(loaded)
        setInput(inputFromDesign(loaded))
        setRequirements(loaded.pieceRequirements)
        setPhotos(loaded.media ?? [])
      }
    }).catch((requestError: unknown) => {
      if (active) setError(apiError(requestError).message)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [designId])

  function close() {
    if (onClose) onClose()
    else navigate('/designs')
  }

  function updateRequirement(index: number, patch: Partial<DesignPieceRequirement>) {
    setRequirements((current) => current.map((requirement, requirementIndex) => requirementIndex === index ? { ...requirement, ...patch } : requirement))
  }

  async function saveDesign(confirmCodeChange: boolean) {
    setError('')
    setFieldErrors({})
    setSaving(true)
    try {
      const designCodeChanged = design ? input.designCode.trim().toUpperCase() !== design.designCode : false
      if (design && designCodeChanged && design.originalSetCount > 0 && !confirmCodeChange) {
        setConfirmingCodeChange(true)
        return
      }
      const saved = design
        ? await updateDesign(design.id, {
          ...input,
          expectedDesignCode: design.designCode,
          confirmCodeChange,
        })
        : await createDesign(input)
      setDesign(saved)
      setInput(inputFromDesign(saved))
      const savedRequirements = await replaceDesignRequirements(saved.id, requirements)
      const complete = { ...saved, pieceRequirements: savedRequirements, media: photos }
      setDesign(complete)
      setInput(inputFromDesign(complete))
      setRequirements(savedRequirements)
      onSaved?.(complete)
      if (!onSaved) navigate('/designs')
    } catch (requestError) {
      const parsed = apiError(requestError)
      if (parsed.code === 'DESIGN_CODE_CHANGE_CONFIRMATION_REQUIRED') {
        setConfirmingCodeChange(true)
        return
      }
      if (parsed.code === 'DESIGN_CODE_STALE') {
        setError('This Design Code changed elsewhere. Reload the design before trying again.')
        return
      }
      setError(parsed.message)
      setFieldErrors(parsed.fieldErrors)
    } finally {
      setSaving(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void saveDesign(false)
  }

  if (loading) return <LoadingState label="Loading design" />

  return <AccessibleSheet label={design ? 'Edit design' : 'Add design'} onRequestClose={close}>
    <div className="editor-heading"><div><h1>{design ? 'Edit design' : 'Add design'}</h1><p>Define the costume and the pieces each complete set needs.</p></div><button data-initial-focus className="icon-button" type="button" onClick={close} aria-label="Close design editor">×</button></div>
    {error ? <ErrorBanner message={error} /> : null}
    <form onSubmit={submit} className="editor-form">
      <div className="editor-fields two-column">
        <label>Design code
          <input value={input.designCode} onChange={(event) => setInput({ ...input, designCode: event.target.value })} minLength={2} maxLength={20} pattern="[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*" aria-describedby={fieldErrors.designCode ? 'design-code-help design-code-error' : 'design-code-help'} />
          <small id="design-code-help">Use letters, numbers, hyphens, or underscores.</small>
          {fieldErrors.designCode ? <span id="design-code-error" className="field-error">{fieldErrors.designCode}</span> : null}
        </label>
        <label>Name<input value={input.name} onChange={(event) => setInput({ ...input, name: event.target.value })} />{fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}</label>
        <label>Costume type<input value={input.costumeType} onChange={(event) => setInput({ ...input, costumeType: event.target.value })} />{fieldErrors.costumeType ? <span className="field-error">{fieldErrors.costumeType}</span> : null}</label>
        <label>Primary color<input value={input.primaryColor ?? ''} onChange={(event) => setInput({ ...input, primaryColor: event.target.value })} /></label>
        <label>Secondary color<input value={input.secondaryColor ?? ''} onChange={(event) => setInput({ ...input, secondaryColor: event.target.value })} /></label>
        <label className="wide-field">Description<textarea value={input.description ?? ''} onChange={(event) => setInput({ ...input, description: event.target.value })} /></label>
      </div>
      <fieldset className="requirements"><legend>Required pieces</legend><p>Add, order, and mark the pieces required for this design.</p>
        {requirements.map((requirement, index) => <div key={`${requirement.pieceTypeId}-${index}`} className="requirement-row">
          <label>Order<input aria-label={`Piece ${index + 1} order`} type="number" min="0" value={requirement.sortOrder} onChange={(event) => updateRequirement(index, { sortOrder: Number(event.target.value) })} /></label>
          <label>Piece<select aria-label={`Piece ${index + 1}`} value={requirement.pieceTypeId} onChange={(event) => { const type = pieceTypes.find((candidate) => candidate.id === event.target.value); if (type) updateRequirement(index, rowFromPiece(type, requirement.sortOrder)) }}><option value="">Choose a piece</option>{pieceTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
          <label>Quantity<input aria-label={`Piece ${index + 1} quantity`} type="number" min="1" value={requirement.quantity} onChange={(event) => updateRequirement(index, { quantity: Number(event.target.value) })} /></label>
          <label className="check-field"><input type="checkbox" checked={requirement.required} onChange={(event) => updateRequirement(index, { required: event.target.checked })} /> Required</label>
          <button type="button" className="icon-button" aria-label={`Remove piece ${index + 1}`} onClick={() => setRequirements((current) => current.filter((_, requirementIndex) => requirementIndex !== index))}>×</button>
        </div>)}
        <button type="button" className="button button-secondary" onClick={() => { const available = pieceTypes.find((piece) => !requirements.some((requirement) => requirement.pieceTypeId === piece.id)); if (available) setRequirements((current) => [...current, rowFromPiece(available, current.length)]) }}>Add piece</button>
      </fieldset>
      <fieldset className="requirements"><legend>Reference photos</legend><p>Keep visual references with this design.</p>
        {design ? <><PhotoUploader ownerType="design" ownerId={design.id} purpose="REFERENCE" maxPhotos={12} existingPhotos={photos} onChange={setPhotos} /><PhotoGallery photos={photos} ownerType="design" ownerId={design.id} onChange={setPhotos} /></> : <p>Save the design before adding reference photos.</p>}
      </fieldset>
      <div className="editor-actions">{design ? <button className="button button-secondary" type="button" onClick={() => navigate('/original-sets', { state: { designId: design.id } })}>Onboard next set</button> : null}<button className="button button-secondary" type="button" onClick={close}>Cancel</button><button className="button" disabled={saving} type="submit">{saving ? 'Saving…' : 'Save design'}</button></div>
    </form>
    {confirmingCodeChange ? <AccessibleSheet label="Confirm Design Code change" onRequestClose={() => setConfirmingCodeChange(false)}>
      <div className="editor-heading"><div><h2>Confirm Design Code change</h2><p>{codeChangeWarning}</p></div></div>
      <div className="editor-actions"><button data-initial-focus className="button button-secondary" type="button" onClick={() => setConfirmingCodeChange(false)}>Cancel</button><button className="button" type="button" disabled={saving} onClick={() => { setConfirmingCodeChange(false); void saveDesign(true) }}>Change Design Code</button></div>
    </AccessibleSheet> : null}
  </AccessibleSheet>
}
