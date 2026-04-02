import { useState, useEffect } from 'react'
import type { FamilyMember } from '../api/family'

interface EditMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (input: { name?: string; pin?: string }) => Promise<void>
  member: FamilyMember | null
}

export default function EditMemberModal({ isOpen, onClose, onSave, member }: EditMemberModalProps) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (member) {
      setName(member.name)
      setPin('')
    }
    setError('')
  }, [member, isOpen])

  if (!isOpen || !member) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    if (pin && !/^[0-9]{4,6}$/.test(pin)) { setError('PIN must be 4-6 digits'); return }

    setSaving(true)
    try {
      const input: { name?: string; pin?: string } = {}
      if (name.trim() !== member.name) input.name = name.trim()
      if (pin) input.pin = pin
      await onSave(input)
      onClose()
    } catch {
      setError('Failed to update member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-extrabold text-accent mb-4">Edit Member</h2>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl mb-3">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="New PIN (leave blank to keep current)"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
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
