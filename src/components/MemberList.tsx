import type { FamilyMember } from '../api/family'

interface MemberListProps {
  members: FamilyMember[]
  loading: boolean
  onEdit: (member: FamilyMember) => void
  onRemove: (userId: string) => void
}

export default function MemberList({ members, loading, onEdit, onRemove }: MemberListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">👥 Family Members</h3>
      {members.length === 0 ? (
        <p className="text-gray-400 text-sm">No members yet</p>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-lg">{m.role === 'parent' ? '👨‍👩' : '👧'}</span>
                <span className="font-semibold text-sm">{m.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  m.role === 'parent' ? 'bg-blue-100 text-accent' : 'bg-green-100 text-primary'
                }`}>
                  {m.role}
                </span>
              </div>
              {m.role === 'child' && (
                <div className="flex gap-2">
                  <button onClick={() => onEdit(m)} className="text-sm hover:scale-110 transition-transform" title="Edit">✏️</button>
                  <button onClick={() => onRemove(m.id)} className="text-sm hover:scale-110 transition-transform" title="Remove">🗑</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
