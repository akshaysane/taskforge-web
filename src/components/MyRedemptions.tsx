import { useState } from 'react'
import type { Redemption } from '../api/rewards'
import { cancelRedemption } from '../api/rewards'

interface MyRedemptionsProps {
  redemptions: Redemption[]
  familyId: string
  loading: boolean
  onCancel: () => void
}

export default function MyRedemptions({ redemptions, familyId, loading, onCancel }: MyRedemptionsProps) {
  const [cancelling, setCancelling] = useState<string | null>(null)

  const handleCancel = async (id: string) => {
    setCancelling(id); try { await cancelRedemption(familyId, id); onCancel() } catch {} finally { setCancelling(null) }
  }

  if (loading) {
    return (<div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="h-4 w-36 bg-gray-200 rounded mb-4" /><div className="h-10 bg-gray-100 rounded" /></div>)
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">📦 My Redemptions</h3>
      {redemptions.length === 0 ? (<p className="text-gray-400 text-sm">No redemptions yet</p>) : (
        <div className="space-y-2">{redemptions.map((r) => {
          const statusIcon = r.status === 'fulfilled' ? '✅' : r.status === 'cancelled' ? '❌' : '🟡'
          const statusColor = r.status === 'fulfilled' ? 'text-green-600' : r.status === 'cancelled' ? 'text-red-400' : 'text-orange-500'
          return (
            <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span>{r.reward.icon || '🎁'}</span>
                <div><span className="font-semibold text-sm">{r.reward.name}</span><span className="text-accent text-xs font-bold ml-2">{r.pointsSpent}pts</span></div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold capitalize ${statusColor}`}>{statusIcon} {r.status}</span>
                {r.status === 'pending' && (
                  <button onClick={() => handleCancel(r.id)} disabled={cancelling === r.id}
                    className="text-xs text-red-400 hover:text-red-600 font-semibold disabled:opacity-50">Cancel</button>
                )}
              </div>
            </div>
          )
        })}</div>
      )}
    </div>
  )
}
