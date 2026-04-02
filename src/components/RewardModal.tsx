import { useState, useEffect } from 'react'
import type { Reward, CreateRewardInput } from '../api/rewards'

interface RewardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (input: CreateRewardInput) => Promise<void>
  reward?: Reward | null
}

export default function RewardModal({ isOpen, onClose, onSave, reward }: RewardModalProps) {
  const [name, setName] = useState('')
  const [pointCost, setPointCost] = useState(10)
  const [icon, setIcon] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (reward) { setName(reward.name); setPointCost(reward.pointCost); setIcon(reward.icon || ''); setDescription(reward.description || '') }
    else { setName(''); setPointCost(10); setIcon(''); setDescription('') }
    setError('')
  }, [reward, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    if (pointCost < 1) { setError('Point cost must be at least 1'); return }
    setSaving(true)
    try {
      await onSave({ name: name.trim(), pointCost, icon: icon.trim() || undefined, description: description.trim() || undefined })
      onClose()
    } catch { setError('Failed to save reward') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-extrabold text-accent mb-4">{reward ? 'Edit Reward' : 'New Reward'}</h2>
        {error && <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Reward name" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <div className="flex gap-3">
            <input type="number" placeholder="Point cost" min={1} value={pointCost} onChange={(e) => setPointCost(Number(e.target.value))}
              className="flex-1 bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="text" placeholder="Icon (emoji)" value={icon} onChange={(e) => setIcon(e.target.value)}
              className="w-24 bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-full transition-colors">
              {saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-full transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
