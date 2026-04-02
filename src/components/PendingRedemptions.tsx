import { useState } from 'react'
import type { Redemption } from '../api/rewards'
import { fulfillRedemption, cancelRedemption } from '../api/rewards'

interface PendingRedemptionsProps {
  redemptions: Redemption[]
  familyId: string
  loading: boolean
  onAction: () => void
}

export default function PendingRedemptions({ redemptions, familyId, loading, onAction }: PendingRedemptionsProps) {
  const [actingOn, setActingOn] = useState<string | null>(null)
  const pending = redemptions.filter((r) => r.status === 'pending')

  const handleFulfill = async (id: string) => {
    setActingOn(id); try { await fulfillRedemption(familyId, id); onAction() } catch {} finally { setActingOn(null) }
  }
  const handleCancel = async (id: string) => {
    setActingOn(id); try { await cancelRedemption(familyId, id); onAction() } catch {} finally { setActingOn(null) }
  }

  if (loading) {
    return (<div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="h-4 w-48 bg-gray-200 rounded mb-4" /><div className="h-10 bg-gray-100 rounded mb-2" /></div>)
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">⏳ Pending Redemptions ({pending.length})</h3>
      {pending.length === 0 ? (<p className="text-gray-400 text-sm">No pending redemptions 🎉</p>) : (
        <div className="space-y-2">{pending.map((r) => (
          <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
            <div>
              <span className="font-semibold text-sm">{r.redeemedBy.name}</span>
              <span className="text-gray-400 text-sm"> — {r.reward.icon || '🎁'} {r.reward.name}</span>
              <span className="text-accent text-xs font-bold ml-2">{r.pointsSpent}pts</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleFulfill(r.id)} disabled={actingOn === r.id}
                className="text-lg hover:scale-110 transition-transform disabled:opacity-50" title="Fulfill">✅</button>
              <button onClick={() => handleCancel(r.id)} disabled={actingOn === r.id}
                className="text-lg hover:scale-110 transition-transform disabled:opacity-50" title="Cancel">❌</button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  )
}
