interface PointsCardProps {
  balance: number
  loading: boolean
}

export default function PointsCard({ balance, loading }: PointsCardProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-green-500 to-green-400 rounded-2xl p-5 text-white animate-pulse">
        <div className="h-4 w-20 bg-white/30 rounded mb-2" />
        <div className="h-10 w-24 bg-white/30 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-green-500 to-green-400 rounded-2xl p-5 text-white text-center">
      <div className="text-sm font-semibold text-white/80">My Points</div>
      <div className="text-4xl font-extrabold mt-1">⭐ {balance}</div>
    </div>
  )
}
