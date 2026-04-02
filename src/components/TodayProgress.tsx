import type { ChoreInstance } from '../api/chores'

interface TodayProgressProps {
  chores: ChoreInstance[]
  loading: boolean
}

export default function TodayProgress({ chores, loading }: TodayProgressProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-green-500 to-green-400 rounded-2xl p-5 text-white animate-pulse">
        <div className="h-4 w-24 bg-white/30 rounded mb-2" />
        <div className="h-8 w-32 bg-white/30 rounded" />
      </div>
    )
  }

  const done = chores.filter((c) => c.status === 'approved').length
  const total = chores.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="bg-gradient-to-br from-green-500 to-green-400 rounded-2xl p-5 text-white">
      <div className="font-semibold text-sm text-white/80">Today's Progress</div>
      <div className="text-3xl font-extrabold mt-1">
        {done} / {total} done
      </div>
      <div className="bg-white/30 rounded-full h-2 mt-3">
        <div
          className="bg-white rounded-full h-2 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
