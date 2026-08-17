import type { ChangeEvent } from 'react'
import { matchModeLabels, type MeasurementDefinitionInput } from '../../api/piece-types'

interface MeasurementFieldsProps {
  value: MeasurementDefinitionInput
  lockedCode?: boolean
  onChange: (value: MeasurementDefinitionInput) => void
  fieldErrors?: Record<string, string>
}

export default function MeasurementFields({ value, lockedCode = false, onChange, fieldErrors = {} }: MeasurementFieldsProps) {
  const change = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value: nextValue } = event.target
    onChange({ ...value, [name]: nextValue })
  }

  return <div className="editor-fields measurement-fields">
    <label>Measurement code
      <input name="code" value={value.code} onChange={change} readOnly={lockedCode} aria-describedby={fieldErrors.code ? 'measurement-code-error' : undefined} />
      {lockedCode ? <small>Referenced codes are locked.</small> : null}
      {fieldErrors.code ? <span id="measurement-code-error" className="field-error">{fieldErrors.code}</span> : null}
    </label>
    <label>Label
      <input name="label" value={value.label} onChange={change} />
      {fieldErrors.label ? <span className="field-error">{fieldErrors.label}</span> : null}
    </label>
    <label>Match mode
      <select name="matchMode" value={value.matchMode} onChange={change}>
        {Object.entries(matchModeLabels).map(([mode, label]) => <option key={mode} value={mode}>{label}</option>)}
      </select>
    </label>
    <label>Matching group
      <input name="matchingGroup" value={value.matchingGroup ?? ''} onChange={change} />
    </label>
    <label>Tolerance (in)
      <input name="defaultTolerance" inputMode="decimal" value={value.defaultTolerance ?? ''} onChange={change} />
      {fieldErrors.defaultTolerance ? <span className="field-error">{fieldErrors.defaultTolerance}</span> : null}
    </label>
    <label>Display order
      <input name="sortOrder" type="number" min="0" value={value.sortOrder ?? 0} onChange={(event) => onChange({ ...value, sortOrder: Number(event.target.value) })} />
    </label>
    <label className="check-field"><input type="checkbox" checked={value.requiredForItem} onChange={(event) => onChange({ ...value, requiredForItem: event.target.checked })} /> Required for item</label>
  </div>
}
