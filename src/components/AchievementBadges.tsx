import type { Achievement } from '../api/chores'

interface AchievementBadgesProps {
  achievements: Achievement[]
  loading: boolean
}

export default function AchievementBadges({ achievements, loading }: AchievementBadgesProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="flex gap-2">
          <div className="w-12 h-12 bg-gray-100 rounded-full" />
          <div className="w-12 h-12 bg-gray-100 rounded-full" />
          <div className="w-12 h-12 bg-gray-100 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">🏅 Achievements</h3>
      {achievements.length === 0 ? (
        <p className="text-gray-400 text-sm">Complete chores to earn badges!</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {achievements.map((a) => (
            <div
              key={a.key}
              className="flex flex-col items-center bg-amber-50 rounded-xl p-3 min-w-[72px]"
              title={a.description}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-xs font-bold text-gray-600 mt-1 text-center">{a.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
