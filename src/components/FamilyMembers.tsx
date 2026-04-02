import type { FamilyMember } from '../api/chores'

interface MemberWithStats extends FamilyMember {
  balance: number
  choresDone: number
  choresTotal: number
}

interface FamilyMembersProps {
  members: MemberWithStats[]
  loading: boolean
}

export default function FamilyMembers({ members, loading }: FamilyMembersProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  const children = members.filter((m) => m.role === 'child')

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h3 className="font-bold text-accent mb-3">👨‍👩‍👧‍👦 Family</h3>
        <p className="text-gray-400 text-sm">No children in the family yet</p>
      </div>
    )
  }

  const colors = ['bg-green-50', 'bg-blue-50', 'bg-purple-50', 'bg-orange-50']

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">👨‍👩‍👧‍👦 Family</h3>
      <div className="grid grid-cols-2 gap-3">
        {children.map((child, i) => (
          <div
            key={child.id}
            className={`${colors[i % colors.length]} rounded-xl p-4 text-center`}
          >
            <div className="text-2xl mb-1">
              {child.avatarUrl ? (
                <img src={child.avatarUrl} alt="" className="w-8 h-8 rounded-full mx-auto" />
              ) : (
                '👧'
              )}
            </div>
            <div className="font-bold text-sm">{child.name}</div>
            <div className="text-primary font-bold text-sm">⭐ {child.balance}pts</div>
            <div className="text-gray-400 text-xs">
              {child.choresDone}/{child.choresTotal} done
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
