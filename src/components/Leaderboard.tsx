interface LeaderboardEntry {
  id: string
  name: string
  balance: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId: string
  loading: boolean
}

export default function Leaderboard({ entries, currentUserId, loading }: LeaderboardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-8 bg-gray-100 rounded" />
          <div className="h-8 bg-gray-100 rounded" />
        </div>
      </div>
    )
  }

  const sorted = [...entries].sort((a, b) => b.balance - a.balance)
  const rankColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600']

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">🏆 Leaderboard</h3>
      {sorted.length === 0 ? (
        <p className="text-gray-400 text-sm">No family members yet</p>
      ) : (
        <div className="space-y-1">
          {sorted.map((entry, i) => {
            const isMe = entry.id === currentUserId
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 py-2 px-3 rounded-xl ${
                  isMe ? 'bg-blue-50' : ''
                }`}
              >
                <span className={`font-extrabold w-6 ${rankColors[i] || 'text-gray-300'}`}>
                  {i + 1}.
                </span>
                <span className={`flex-1 font-semibold text-sm ${isMe ? 'text-accent' : ''}`}>
                  {entry.name}
                  {isMe && <span className="text-xs text-gray-400 ml-1">(you)</span>}
                </span>
                <span className="text-primary font-bold text-sm">{entry.balance}pts</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
