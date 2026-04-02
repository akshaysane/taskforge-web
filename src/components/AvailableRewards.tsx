import { useState } from 'react'
import type { Reward } from '../api/rewards'
import { redeemReward } from '../api/rewards'

interface AvailableRewardsProps {
  rewards: Reward[]
  familyId: string
  balance: number
  loading: boolean
  onRedeem: () => void
}

export default function AvailableRewards({ rewards, familyId, balance, loading, onRedeem }: AvailableRewardsProps) {
  const [redeeming, setRedeeming] = useState<string | null>(null)

  const handleRedeem = async (rewardId: string) => {
    setRedeeming(rewardId)
    try { await redeemReward(familyId, rewardId); onRedeem() } catch {}
    finally { setRedeeming(null) }
  }

  if (loading) {
    return (<div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="h-4 w-28 bg-gray-200 rounded mb-4" /><div className="space-y-2"><div className="h-12 bg-gray-100 rounded-xl" /><div className="h-12 bg-gray-100 rounded-xl" /></div></div>)
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">🎁 Rewards</h3>
      {rewards.length === 0 ? (<p className="text-gray-400 text-sm">No rewards available yet</p>) : (
        <div className="space-y-2">{rewards.map((r) => {
          const canAfford = balance >= r.pointCost
          const deficit = r.pointCost - balance
          return (
            <div key={r.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-lg">{r.icon || '🎁'}</span>
                <div><div className="font-semibold text-sm">{r.name}</div><div className="text-accent text-xs font-bold">{r.pointCost}pts</div></div>
              </div>
              {canAfford ? (
                <button onClick={() => handleRedeem(r.id)} disabled={redeeming === r.id}
                  className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-xs font-bold py-1.5 px-4 rounded-full transition-colors">
                  {redeeming === r.id ? '...' : 'Redeem'}</button>
              ) : (<span className="text-gray-400 text-xs font-semibold">Need {deficit} more</span>)}
            </div>
          )
        })}</div>
      )}
    </div>
  )
}
