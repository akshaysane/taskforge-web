# ChoreChamps Home Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the role-adaptive home screen — parents see a grid dashboard with today's progress, pending approvals, and family members; children see an action-focused view with points, streak, chore checklist, and leaderboard.

**Architecture:** Replace the placeholder Home.tsx with a role-based router that renders ParentHome or ChildHome. Each view is composed of small, focused components. A new API module (`chores.ts`) provides all data-fetching functions. Components fetch their own data independently.

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, Axios, Zustand (auth store)

---

## File Map

```
src/
  api/
    chores.ts                  # Create: chore + points + members API functions

  components/
    Header.tsx                 # Create: shared sticky header with logo + logout
    TodayProgress.tsx          # Create: green progress card (parent)
    PendingApprovals.tsx       # Create: approval list with approve/reject buttons
    FamilyMembers.tsx          # Create: child cards grid (parent)
    PointsCard.tsx             # Create: points balance card (child)
    StreakCard.tsx              # Create: streak display card (child)
    ChoreChecklist.tsx         # Create: chore list with Done buttons (child)
    Leaderboard.tsx            # Create: ranked points list (child)

  pages/
    Home.tsx                   # Modify: role router → ParentHome or ChildHome
    ParentHome.tsx             # Create: parent dashboard page
    ChildHome.tsx              # Create: child action view page
```

---

## Task 1: Chores API Module

**Files:**
- Create: `src/api/chores.ts`

- [ ] **Step 1: Create the chores API module**

Create `src/api/chores.ts`:

```typescript
import apiClient from './client'

interface ChoreAssignee {
  id: string
  name: string
  avatarUrl: string | null
}

export interface ChoreInstance {
  id: string
  title: string
  points: number
  status: 'pending' | 'completed' | 'approved' | 'rejected'
  requiresApproval: boolean
  dueDate: string
  completedAt: string | null
  approvedAt: string | null
  approvedById: string | null
  assignedTo: ChoreAssignee
}

export interface PointsBalance {
  userId: string
  balance: number
}

export interface PointsEntry {
  id: string
  amount: number
  reason: string
  note: string | null
  createdAt: string
  choreInstance: { title: string } | null
}

export interface FamilyMember {
  id: string
  name: string
  role: string
  avatarUrl: string | null
  email: string | null
}

export async function getTodayChores(familyId: string): Promise<ChoreInstance[]> {
  const { data } = await apiClient.get<ChoreInstance[]>(
    `/api/families/${familyId}/chores/today`,
  )
  return data
}

export async function getPendingApprovals(familyId: string): Promise<ChoreInstance[]> {
  const { data } = await apiClient.get<ChoreInstance[]>(
    `/api/families/${familyId}/chores/pending`,
  )
  return data
}

export async function completeChore(
  familyId: string,
  choreId: string,
): Promise<ChoreInstance> {
  const { data } = await apiClient.patch<ChoreInstance>(
    `/api/families/${familyId}/chores/${choreId}/complete`,
  )
  return data
}

export async function approveChore(
  familyId: string,
  choreId: string,
): Promise<ChoreInstance> {
  const { data } = await apiClient.patch<ChoreInstance>(
    `/api/families/${familyId}/chores/${choreId}/approve`,
  )
  return data
}

export async function rejectChore(
  familyId: string,
  choreId: string,
): Promise<ChoreInstance> {
  const { data } = await apiClient.patch<ChoreInstance>(
    `/api/families/${familyId}/chores/${choreId}/reject`,
  )
  return data
}

export async function getPointsBalance(
  familyId: string,
  userId: string,
): Promise<PointsBalance> {
  const { data } = await apiClient.get<PointsBalance>(
    `/api/families/${familyId}/members/${userId}/points`,
  )
  return data
}

export async function getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
  const { data } = await apiClient.get<FamilyMember[]>(
    `/api/families/${familyId}/members`,
  )
  return data
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/api/chores.ts
git commit -m "feat: add chores, points, and members API functions"
```

---

## Task 2: Header Component

**Files:**
- Create: `src/components/Header.tsx`

- [ ] **Step 1: Create the shared Header**

Create `src/components/Header.tsx`:

```tsx
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { logoutUser } from '../api/auth'

export default function Header() {
  const navigate = useNavigate()
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await logoutUser(refreshToken)
      } catch {
        // logout anyway
      }
    }
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-accent">🏠 ChoreChamps</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500 font-semibold transition-colors"
        >
          Log Out
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: add shared Header component with sticky positioning"
```

---

## Task 3: Parent Dashboard Components

**Files:**
- Create: `src/components/TodayProgress.tsx`
- Create: `src/components/PendingApprovals.tsx`
- Create: `src/components/FamilyMembers.tsx`

- [ ] **Step 1: Create TodayProgress component**

Create `src/components/TodayProgress.tsx`:

```tsx
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
```

- [ ] **Step 2: Create PendingApprovals component**

Create `src/components/PendingApprovals.tsx`:

```tsx
import { useState } from 'react'
import type { ChoreInstance } from '../api/chores'
import { approveChore, rejectChore } from '../api/chores'

interface PendingApprovalsProps {
  chores: ChoreInstance[]
  familyId: string
  loading: boolean
  onAction: () => void
}

export default function PendingApprovals({
  chores,
  familyId,
  loading,
  onAction,
}: PendingApprovalsProps) {
  const [actingOn, setActingOn] = useState<string | null>(null)

  const handleApprove = async (choreId: string) => {
    setActingOn(choreId)
    try {
      await approveChore(familyId, choreId)
      onAction()
    } catch {
      // ignore
    } finally {
      setActingOn(null)
    }
  }

  const handleReject = async (choreId: string) => {
    setActingOn(choreId)
    try {
      await rejectChore(familyId, choreId)
      onAction()
    } catch {
      // ignore
    } finally {
      setActingOn(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-10 bg-gray-100 rounded mb-2" />
        <div className="h-10 bg-gray-100 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">⏳ Pending Approvals ({chores.length})</h3>
      {chores.length === 0 ? (
        <p className="text-gray-400 text-sm">No chores waiting for approval 🎉</p>
      ) : (
        <div className="space-y-2">
          {chores.map((chore) => (
            <div
              key={chore.id}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl"
            >
              <div>
                <span className="font-semibold text-sm">{chore.assignedTo.name}</span>
                <span className="text-gray-400 text-sm"> — {chore.title}</span>
                <span className="text-primary text-xs font-bold ml-2">+{chore.points}pts</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(chore.id)}
                  disabled={actingOn === chore.id}
                  className="text-lg hover:scale-110 transition-transform disabled:opacity-50"
                  title="Approve"
                >
                  ✅
                </button>
                <button
                  onClick={() => handleReject(chore.id)}
                  disabled={actingOn === chore.id}
                  className="text-lg hover:scale-110 transition-transform disabled:opacity-50"
                  title="Reject"
                >
                  ❌
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create FamilyMembers component**

Create `src/components/FamilyMembers.tsx`:

```tsx
import type { FamilyMember } from '../api/chores'
import type { ChoreInstance } from '../api/chores'

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
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/components/TodayProgress.tsx src/components/PendingApprovals.tsx src/components/FamilyMembers.tsx
git commit -m "feat: add TodayProgress, PendingApprovals, FamilyMembers components"
```

---

## Task 4: Child View Components

**Files:**
- Create: `src/components/PointsCard.tsx`
- Create: `src/components/StreakCard.tsx`
- Create: `src/components/ChoreChecklist.tsx`
- Create: `src/components/Leaderboard.tsx`

- [ ] **Step 1: Create PointsCard component**

Create `src/components/PointsCard.tsx`:

```tsx
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
```

- [ ] **Step 2: Create StreakCard component**

Create `src/components/StreakCard.tsx`:

```tsx
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
```

- [ ] **Step 3: Create ChoreChecklist component**

Create `src/components/ChoreChecklist.tsx`:

```tsx
import { useState } from 'react'
import type { ChoreInstance } from '../api/chores'
import { completeChore } from '../api/chores'

interface ChoreChecklistProps {
  chores: ChoreInstance[]
  familyId: string
  loading: boolean
  onComplete: () => void
}

export default function ChoreChecklist({
  chores,
  familyId,
  loading,
  onComplete,
}: ChoreChecklistProps) {
  const [completing, setCompleting] = useState<string | null>(null)

  const handleComplete = async (choreId: string) => {
    setCompleting(choreId)
    try {
      await completeChore(familyId, choreId)
      onComplete()
    } catch {
      // ignore
    } finally {
      setCompleting(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">📋 My Chores Today</h3>
      {chores.length === 0 ? (
        <p className="text-gray-400 text-sm">No chores today! 🎉</p>
      ) : (
        <div className="space-y-2">
          {chores.map((chore) => {
            const isApproved = chore.status === 'approved'
            const isCompleted = chore.status === 'completed'
            const isPending = chore.status === 'pending'

            let bg = 'bg-white border-2 border-gray-200'
            let icon = '⬜'
            if (isApproved) {
              bg = 'bg-green-50'
              icon = '✅'
            } else if (isCompleted) {
              bg = 'bg-orange-50'
              icon = '⏳'
            }

            return (
              <div
                key={chore.id}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl ${bg}`}
              >
                <span className="text-lg">{icon}</span>
                <span
                  className={`flex-1 text-sm font-medium ${
                    isApproved ? 'line-through text-gray-400' : ''
                  }`}
                >
                  {chore.title}
                </span>
                {isApproved && (
                  <span className="text-primary text-xs font-bold">+{chore.points}pts</span>
                )}
                {isCompleted && (
                  <span className="text-orange-500 text-xs font-semibold">awaiting approval</span>
                )}
                {isPending && (
                  <button
                    onClick={() => handleComplete(chore.id)}
                    disabled={completing === chore.id}
                    className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-xs font-bold py-1.5 px-4 rounded-full transition-colors"
                  >
                    {completing === chore.id ? '...' : 'Done!'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Create Leaderboard component**

Create `src/components/Leaderboard.tsx`:

```tsx
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
```

- [ ] **Step 5: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add src/components/PointsCard.tsx src/components/StreakCard.tsx src/components/ChoreChecklist.tsx src/components/Leaderboard.tsx
git commit -m "feat: add PointsCard, StreakCard, ChoreChecklist, Leaderboard components"
```

---

## Task 5: ParentHome Page

**Files:**
- Create: `src/pages/ParentHome.tsx`

- [ ] **Step 1: Create ParentHome page**

Create `src/pages/ParentHome.tsx`:

```tsx
import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import {
  getTodayChores,
  getPendingApprovals,
  getPointsBalance,
  getFamilyMembers,
} from '../api/chores'
import type { ChoreInstance, FamilyMember } from '../api/chores'
import Header from '../components/Header'
import TodayProgress from '../components/TodayProgress'
import PendingApprovals from '../components/PendingApprovals'
import FamilyMembers from '../components/FamilyMembers'

interface MemberWithStats extends FamilyMember {
  balance: number
  choresDone: number
  choresTotal: number
}

export default function ParentHome() {
  const user = useAuthStore((s) => s.user)
  const familyId = user?.familyId

  const [chores, setChores] = useState<ChoreInstance[]>([])
  const [pending, setPending] = useState<ChoreInstance[]>([])
  const [members, setMembers] = useState<MemberWithStats[]>([])
  const [loadingChores, setLoadingChores] = useState(true)
  const [loadingPending, setLoadingPending] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(true)

  const fetchChores = useCallback(async () => {
    if (!familyId) return
    setLoadingChores(true)
    try {
      const data = await getTodayChores(familyId)
      setChores(data)
    } catch {
      // ignore
    } finally {
      setLoadingChores(false)
    }
  }, [familyId])

  const fetchPending = useCallback(async () => {
    if (!familyId) return
    setLoadingPending(true)
    try {
      const data = await getPendingApprovals(familyId)
      setPending(data)
    } catch {
      // ignore
    } finally {
      setLoadingPending(false)
    }
  }, [familyId])

  const fetchMembers = useCallback(async () => {
    if (!familyId) return
    setLoadingMembers(true)
    try {
      const rawMembers = await getFamilyMembers(familyId)
      const children = rawMembers.filter((m) => m.role === 'child')

      const withStats = await Promise.all(
        children.map(async (child) => {
          let balance = 0
          try {
            const pts = await getPointsBalance(familyId, child.id)
            balance = pts.balance
          } catch {
            // ignore
          }
          return { ...child, balance, choresDone: 0, choresTotal: 0 }
        }),
      )

      setMembers(withStats)
    } catch {
      // ignore
    } finally {
      setLoadingMembers(false)
    }
  }, [familyId])

  useEffect(() => {
    fetchChores()
    fetchPending()
    fetchMembers()
  }, [fetchChores, fetchPending, fetchMembers])

  // Update member chore stats when chores load
  useEffect(() => {
    if (chores.length > 0 && members.length > 0) {
      setMembers((prev) =>
        prev.map((m) => {
          const memberChores = chores.filter((c) => c.assignedTo.id === m.id)
          return {
            ...m,
            choresDone: memberChores.filter((c) => c.status === 'approved').length,
            choresTotal: memberChores.length,
          }
        }),
      )
    }
  }, [chores])

  const handleAction = () => {
    fetchChores()
    fetchPending()
    fetchMembers()
  }

  if (!familyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-2xl font-extrabold text-accent mb-2">No Family Yet</h2>
            <p className="text-gray-500">Create or join a family to get started!</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Top row: stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TodayProgress chores={chores} loading={loadingChores} />
          <div
            className="bg-gradient-to-br from-orange-400 to-orange-300 rounded-2xl p-5 text-white text-center cursor-pointer"
            onClick={() => document.getElementById('pending')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <div className="text-sm font-semibold text-white/80">Pending Approvals</div>
            <div className="text-3xl font-extrabold mt-1">{pending.length}</div>
            <div className="text-sm text-white/70">waiting</div>
          </div>
        </div>

        {/* Pending approvals */}
        <div id="pending">
          <PendingApprovals
            chores={pending}
            familyId={familyId}
            loading={loadingPending}
            onAction={handleAction}
          />
        </div>

        {/* Family members */}
        <FamilyMembers members={members} loading={loadingMembers} />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/ParentHome.tsx
git commit -m "feat: add ParentHome page with grid dashboard"
```

---

## Task 6: ChildHome Page

**Files:**
- Create: `src/pages/ChildHome.tsx`

- [ ] **Step 1: Create ChildHome page**

Create `src/pages/ChildHome.tsx`:

```tsx
import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import {
  getTodayChores,
  getPointsBalance,
  getFamilyMembers,
} from '../api/chores'
import type { ChoreInstance } from '../api/chores'
import Header from '../components/Header'
import PointsCard from '../components/PointsCard'
import StreakCard from '../components/StreakCard'
import ChoreChecklist from '../components/ChoreChecklist'
import Leaderboard from '../components/Leaderboard'

export default function ChildHome() {
  const user = useAuthStore((s) => s.user)
  const familyId = user?.familyId

  const [chores, setChores] = useState<ChoreInstance[]>([])
  const [balance, setBalance] = useState(0)
  const [leaderboard, setLeaderboard] = useState<{ id: string; name: string; balance: number }[]>(
    [],
  )
  const [loadingChores, setLoadingChores] = useState(true)
  const [loadingPoints, setLoadingPoints] = useState(true)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)

  const fetchChores = useCallback(async () => {
    if (!familyId) return
    setLoadingChores(true)
    try {
      const data = await getTodayChores(familyId)
      setChores(data)
    } catch {
      // ignore
    } finally {
      setLoadingChores(false)
    }
  }, [familyId])

  const fetchPoints = useCallback(async () => {
    if (!familyId || !user) return
    setLoadingPoints(true)
    try {
      const data = await getPointsBalance(familyId, user.id)
      setBalance(data.balance)
    } catch {
      // ignore
    } finally {
      setLoadingPoints(false)
    }
  }, [familyId, user])

  const fetchLeaderboard = useCallback(async () => {
    if (!familyId) return
    setLoadingLeaderboard(true)
    try {
      const members = await getFamilyMembers(familyId)
      const children = members.filter((m) => m.role === 'child')

      const withPoints = await Promise.all(
        children.map(async (child) => {
          let pts = 0
          try {
            const data = await getPointsBalance(familyId, child.id)
            pts = data.balance
          } catch {
            // ignore
          }
          return { id: child.id, name: child.name, balance: pts }
        }),
      )

      setLeaderboard(withPoints)
    } catch {
      // ignore
    } finally {
      setLoadingLeaderboard(false)
    }
  }, [familyId])

  useEffect(() => {
    fetchChores()
    fetchPoints()
    fetchLeaderboard()
  }, [fetchChores, fetchPoints, fetchLeaderboard])

  const handleComplete = () => {
    fetchChores()
    fetchPoints()
    fetchLeaderboard()
  }

  if (!familyId || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <main className="max-w-md mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-2xl font-extrabold text-accent mb-2">No Family Yet</h2>
            <p className="text-gray-500">Ask your parent to add you to a family!</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Top row: points + streak */}
        <div className="grid grid-cols-2 gap-4">
          <PointsCard balance={balance} loading={loadingPoints} />
          <StreakCard streak={0} loading={false} />
        </div>

        {/* Chore checklist */}
        <ChoreChecklist
          chores={chores}
          familyId={familyId}
          loading={loadingChores}
          onComplete={handleComplete}
        />

        {/* Leaderboard */}
        <Leaderboard
          entries={leaderboard}
          currentUserId={user.id}
          loading={loadingLeaderboard}
        />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/ChildHome.tsx
git commit -m "feat: add ChildHome page with action-focused layout"
```

---

## Task 7: Wire Up Home Router

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Replace Home.tsx with role-based router**

Replace `src/pages/Home.tsx` entirely:

```tsx
import { useAuthStore } from '../store/auth'
import ParentHome from './ParentHome'
import ChildHome from './ChildHome'

export default function Home() {
  const user = useAuthStore((s) => s.user)

  if (user?.role === 'child') {
    return <ChildHome />
  }

  return <ParentHome />
}
```

- [ ] **Step 2: Verify dev server runs**

Run: `pnpm dev`
Open http://localhost:5173, log in — should render the parent or child view based on role.

- [ ] **Step 3: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat: replace Home with role-based router to ParentHome/ChildHome"
```

---

## Task 8: Smoke Test

- [ ] **Step 1: Start backend**

From `/home/akshaysane/git/taskforge`: `pnpm dev`

- [ ] **Step 2: Seed the database**

From `/home/akshaysane/git/taskforge`: `pnpm db:seed`

This creates: Alex Parent (parent@demo.com / password123), Emma (child, PIN 1234), Jack (child, PIN 5678), with chores and points.

- [ ] **Step 3: Start frontend**

From `/home/akshaysane/git/taskforge-web`: `pnpm dev`

- [ ] **Step 4: Test parent flow**

1. Log in as parent@demo.com / password123
2. Home should show the grid dashboard with today's progress, pending approvals, family member cards
3. If there are pending approvals, try approve/reject — UI should update

- [ ] **Step 5: Test child flow**

1. Use the PIN login endpoint directly (or add child login UI later)
2. Child should see points balance, streak (0), chore checklist with Done buttons, leaderboard

- [ ] **Step 6: Fix any issues and commit**

```bash
git add -A
git commit -m "fix: address smoke test findings"
```
