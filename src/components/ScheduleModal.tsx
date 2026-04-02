import { useState, useEffect } from 'react'
import type { ChoreTemplate, FamilyMember, CreateScheduleInput } from '../api/chores'
import DayPicker from './DayPicker'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (input: CreateScheduleInput) => Promise<void>
  templates: ChoreTemplate[]
  members: FamilyMember[]
}

export default function ScheduleModal({ isOpen, onClose, onSave, templates, members }: ScheduleModalProps) {
  const [templateId, setTemplateId] = useState('')
  const [childId, setChildId] = useState('')
  const [daysOfWeek, setDaysOfWeek] = useState(0)
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const children = members.filter((m) => m.role === 'child')

  useEffect(() => {
    setTemplateId(templates[0]?.id || '')
    setChildId(children[0]?.id || '')
    setDaysOfWeek(0)
    setEffectiveFrom(new Date().toISOString().split('T')[0])
    setError('')
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateId || !childId) { setError('Please select a template and child'); return }
    if (daysOfWeek === 0) { setError('Please select at least one day'); return }
    setSaving(true)
    try {
      await onSave({ choreTemplateId: templateId, assignedToId: childId, daysOfWeek, effectiveFrom })
      onClose()
    } catch {
      setError('Failed to create schedule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-extrabold text-accent mb-4">New Schedule</h2>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl mb-3">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Template</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}
              className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.icon || '📝'} {t.name} ({t.points}pts)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Assign To</label>
            <select value={childId} onChange={(e) => setChildId(e.target.value)}
              className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Days</label>
            <DayPicker value={daysOfWeek} onChange={setDaysOfWeek} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 block mb-1">Effective From</label>
            <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)}
              className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-full transition-colors">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-full transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
