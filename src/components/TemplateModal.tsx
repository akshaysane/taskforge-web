import { useState, useEffect } from 'react'
import type { ChoreTemplate, CreateTemplateInput } from '../api/chores'

interface TemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (input: CreateTemplateInput) => Promise<void>
  template?: ChoreTemplate | null
}

export default function TemplateModal({ isOpen, onClose, onSave, template }: TemplateModalProps) {
  const [name, setName] = useState('')
  const [points, setPoints] = useState(0)
  const [icon, setIcon] = useState('')
  const [requiresApproval, setRequiresApproval] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (template) {
      setName(template.name)
      setPoints(template.points)
      setIcon(template.icon || '')
      setRequiresApproval(template.requiresApproval)
    } else {
      setName('')
      setPoints(0)
      setIcon('')
      setRequiresApproval(true)
    }
    setError('')
  }, [template, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    try {
      await onSave({ name: name.trim(), points, icon: icon.trim() || undefined, requiresApproval })
      onClose()
    } catch {
      setError('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-extrabold text-accent mb-4">
          {template ? 'Edit Template' : 'New Template'}
        </h2>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl mb-3">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Chore name" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <div className="flex gap-3">
            <input type="number" placeholder="Points" min={0} value={points} onChange={(e) => setPoints(Number(e.target.value))}
              className="flex-1 bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="text" placeholder="Icon (emoji)" value={icon} onChange={(e) => setIcon(e.target.value)}
              className="w-24 bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)}
              className="w-4 h-4 rounded accent-primary" />
            <span className="font-medium text-gray-600">Requires parent approval</span>
          </label>
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
