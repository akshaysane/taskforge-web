interface StreakCardProps {
  streak: number
  loading: boolean
}

export default function StreakCard({ streak, loading }: StreakCardProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-500 to-amber-400 rounded-2xl p-5 text-white animate-pulse">
        <div className="h-4 w-16 bg-white/30 rounded mb-2" />
        <div className="h-10 w-20 bg-white/30 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-amber-500 to-amber-400 rounded-2xl p-5 text-white text-center">
      <div className="text-sm font-semibold text-white/80">Streak</div>
      <div className="text-4xl font-extrabold mt-1">🔥 {streak}</div>
    </div>
  )
}
