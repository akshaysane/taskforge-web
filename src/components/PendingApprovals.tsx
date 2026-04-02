import { useState } from 'react'
import type { ChoreInstance } from '../api/chores'
import { approveChore, rejectChore } from '../api/chores'

interface PendingApprovalsProps {
  chores: ChoreInstance[]
  familyId: string
  loading: boolean
  onAction: () => void
}

export default function PendingApprovals({
  chores,
  familyId,
  loading,
  onAction,
}: PendingApprovalsProps) {
  const [actingOn, setActingOn] = useState<string | null>(null)

  const handleApprove = async (choreId: string) => {
    setActingOn(choreId)
    try {
      await approveChore(familyId, choreId)
      onAction()
    } catch {
      // ignore
    } finally {
      setActingOn(null)
    }
  }

  const handleReject = async (choreId: string) => {
    setActingOn(choreId)
    try {
      await rejectChore(familyId, choreId)
      onAction()
    } catch {
      // ignore
    } finally {
      setActingOn(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-10 bg-gray-100 rounded mb-2" />
        <div className="h-10 bg-gray-100 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">⏳ Pending Approvals ({chores.length})</h3>
      {chores.length === 0 ? (
        <p className="text-gray-400 text-sm">No chores waiting for approval 🎉</p>
      ) : (
        <div className="space-y-2">
          {chores.map((chore) => (
            <div
              key={chore.id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl"
            >
              <div>
                <span className="font-semibold text-sm">{chore.assignedTo.name}</span>
                <span className="text-gray-400 text-sm"> — {chore.title}</span>
                <span className="text-primary text-xs font-bold ml-2">+{chore.points}pts</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(chore.id)}
                  disabled={actingOn === chore.id}
                  className="text-lg hover:scale-110 transition-transform disabled:opacity-50"
                  title="Approve"
                >
                  ✅
                </button>
                <button
                  onClick={() => handleReject(chore.id)}
                  disabled={actingOn === chore.id}
                  className="text-lg hover:scale-110 transition-transform disabled:opacity-50"
                  title="Reject"
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
