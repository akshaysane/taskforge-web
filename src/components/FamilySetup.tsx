import { useState } from 'react'

interface FamilySetupProps {
  onCreated: (familyId: string) => void
  createFamily: (name: string) => Promise<{ id: string }>
}

export default function FamilySetup({ onCreated, createFamily }: FamilySetupProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Family name is required'); return }
    setLoading(true)
    setError('')
    try {
      const family = await createFamily(name.trim())
      onCreated(family.id)
    } catch {
      setError('Failed to create family')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="text-center">
      <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
      <h2 className="text-2xl font-extrabold text-accent mb-2">Welcome!</h2>
      <p className="text-gray-500 mb-6">Let's set up your family to get started</p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Family name (e.g. The Smiths)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-full text-lg transition-colors"
        >
          {loading ? 'Creating...' : 'Create Family'}
        </button>
      </form>
    </div>
  )
}
