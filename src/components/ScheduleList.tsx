import type { ChoreSchedule } from '../api/chores'
import DayPicker from './DayPicker'

interface ScheduleListProps {
  schedules: ChoreSchedule[]
  loading: boolean
  onDelete: (scheduleId: string) => void
  onNew: () => void
}

export default function ScheduleList({ schedules, loading, onDelete, onNew }: ScheduleListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-accent">📅 Schedules</h3>
        <button onClick={onNew}
          className="bg-primary hover:bg-primary-dark text-white text-xs font-bold py-1.5 px-4 rounded-full transition-colors">
          + New
        </button>
      </div>
      {schedules.length === 0 ? (
        <p className="text-gray-400 text-sm">No schedules yet — assign chores to your kids</p>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <div key={s.id} className="py-3 px-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm">
                  <span className="font-semibold">{s.assignedTo.name}</span>
                  <span className="text-gray-400"> → </span>
                  <span className="font-semibold">{s.choreTemplate.name}</span>
                  <span className="text-primary text-xs font-bold ml-2">{s.choreTemplate.points}pts</span>
                </div>
                <button onClick={() => onDelete(s.id)} className="text-sm hover:scale-110 transition-transform" title="Delete">🗑</button>
              </div>
              <DayPicker value={s.daysOfWeek} onChange={() => {}} readonly />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
