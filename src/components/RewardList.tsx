import type { Reward } from '../api/rewards'

interface RewardListProps {
  rewards: Reward[]
  loading: boolean
  onEdit: (reward: Reward) => void
  onDelete: (rewardId: string) => void
  onNew: () => void
}

export default function RewardList({ rewards, loading, onEdit, onDelete, onNew }: RewardListProps) {
  if (loading) {
    return (<div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
      <div className="h-4 w-32 bg-gray-200 rounded mb-4" /><div className="space-y-2"><div className="h-10 bg-gray-100 rounded-xl" /><div className="h-10 bg-gray-100 rounded-xl" /></div></div>)
  }
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-accent">🎁 Rewards</h3>
        <button onClick={onNew} className="bg-primary hover:bg-primary-dark text-white text-xs font-bold py-1.5 px-4 rounded-full transition-colors">+ New</button>
      </div>
      {rewards.length === 0 ? (<p className="text-gray-400 text-sm">No rewards yet — create one for your kids</p>) : (
        <div className="space-y-2">{rewards.map((r) => (
          <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span>{r.icon || '🎁'}</span><span className="font-semibold text-sm">{r.name}</span>
              <span className="text-accent text-xs font-bold">{r.pointCost}pts</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onEdit(r)} className="text-sm hover:scale-110 transition-transform" title="Edit">✏️</button>
              <button onClick={() => onDelete(r.id)} className="text-sm hover:scale-110 transition-transform" title="Delete">🗑</button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  )
}
