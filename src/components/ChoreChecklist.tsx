import { useState } from 'react'
import type { ChoreInstance } from '../api/chores'
import { completeChore } from '../api/chores'

interface ChoreChecklistProps {
  chores: ChoreInstance[]
  familyId: string
  loading: boolean
  onComplete: () => void
}

export default function ChoreChecklist({
  chores,
  familyId,
  loading,
  onComplete,
}: ChoreChecklistProps) {
  const [completing, setCompleting] = useState<string | null>(null)

  const handleComplete = async (choreId: string) => {
    setCompleting(choreId)
    try {
      await completeChore(familyId, choreId)
      onComplete()
    } catch {
      // ignore
    } finally {
      setCompleting(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">📋 My Chores Today</h3>
      {chores.length === 0 ? (
        <p className="text-gray-400 text-sm">No chores today! 🎉</p>
      ) : (
        <div className="space-y-2">
          {chores.map((chore) => {
            const isApproved = chore.status === 'approved'
            const isCompleted = chore.status === 'completed'
            const isPending = chore.status === 'pending'

            let bg = 'bg-white border-2 border-gray-200'
            let icon = '⬜'
            if (isApproved) {
              bg = 'bg-green-50'
              icon = '✅'
            } else if (isCompleted) {
              bg = 'bg-orange-50'
              icon = '⏳'
            }

            return (
              <div
                key={chore.id}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl ${bg}`}
              >
                <span className="text-lg">{icon}</span>
                <span
                  className={`flex-1 text-sm font-medium ${
                    isApproved ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {chore.title}
                </span>
                {isApproved && (
                  <span className="text-primary text-xs font-bold">+{chore.points}pts</span>
                )}
                {isCompleted && (
                  <span className="text-orange-500 text-xs font-semibold">awaiting approval</span>
                )}
                {isPending && (
                  <button
                    onClick={() => handleComplete(chore.id)}
                    disabled={completing === chore.id}
                    className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-xs font-bold py-1.5 px-4 rounded-full transition-colors"
                  >
                    {completing === chore.id ? '...' : 'Done!'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
