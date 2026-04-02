import { useState } from 'react'

interface AddChildFormProps {
  onAdded: () => void
  addChild: (input: { name: string; pin: string }) => Promise<void>
}

export default function AddChildForm({ onAdded, addChild }: AddChildFormProps) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    if (!/^[0-9]{4,6}$/.test(pin)) { setError('PIN must be 4-6 digits'); return }
    setLoading(true)
    setError('')
    try {
      await addChild({ name: name.trim(), pin })
      setName('')
      setPin('')
      onAdded()
    } catch {
      setError('Failed to add child')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">➕ Add Child</h3>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl mb-3">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <input
          type="text"
          placeholder="Child's name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          className="w-24 bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 px-6 rounded-full text-sm transition-colors whitespace-nowrap"
        >
          {loading ? '...' : 'Add'}
        </button>
      </form>
    </div>
  )
}
