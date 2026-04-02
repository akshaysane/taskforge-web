# Rewards UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the parent rewards management page (catalog CRUD + fulfill/cancel redemptions) and child reward browsing/redemption on the home screen.

**Architecture:** New rewards API module, RewardsManagement page for parents with NavBar, and AvailableRewards + MyRedemptions components added to ChildHome. Follows existing patterns.

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, Axios, React Router v7

---

## File Map

```
src/
  api/
    rewards.ts                 # Create: reward + redemption API functions

  components/
    RewardList.tsx             # Create: reward catalog list (parent)
    RewardModal.tsx            # Create: create/edit reward modal (parent)
    PendingRedemptions.tsx     # Create: pending redemptions with fulfill/cancel (parent)
    AvailableRewards.tsx       # Create: rewards with redeem button (child)
    MyRedemptions.tsx          # Create: child's redemption history

  pages/
    RewardsManagement.tsx      # Create: parent rewards page
    ChildHome.tsx              # Modify: add rewards + redemptions sections

  components/
    NavBar.tsx                 # Modify: enable Rewards tab

  App.tsx                      # Modify: add /rewards route
```

---

## Task 1: Rewards API Module

**Files:**
- Create: `src/api/rewards.ts`

- [ ] **Step 1: Create rewards API module**

Create `src/api/rewards.ts`:

```typescript
import apiClient from './client'

export interface Reward {
  id: string
  name: string
  description: string | null
  icon: string | null
  pointCost: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateRewardInput {
  name: string
  description?: string
  icon?: string
  pointCost: number
}

export interface Redemption {
  id: string
  pointsSpent: number
  status: 'pending' | 'fulfilled' | 'cancelled'
  createdAt: string
  fulfilledAt: string | null
  reward: { id: string; name: string; icon: string | null }
  redeemedBy: { id: string; name: string }
  fulfilledBy: { id: string; name: string } | null
}

// --- Reward CRUD ---

export async function getRewards(familyId: string): Promise<Reward[]> {
  const { data } = await apiClient.get<Reward[]>(`/api/families/${familyId}/rewards`)
  return data
}

export async function createReward(familyId: string, input: CreateRewardInput): Promise<Reward> {
  const { data } = await apiClient.post<Reward>(`/api/families/${familyId}/rewards`, input)
  return data
}

export async function updateReward(
  familyId: string,
  rewardId: string,
  input: Partial<CreateRewardInput>,
): Promise<Reward> {
  const { data } = await apiClient.patch<Reward>(
    `/api/families/${familyId}/rewards/${rewardId}`,
    input,
  )
  return data
}

export async function deleteReward(familyId: string, rewardId: string): Promise<void> {
  await apiClient.delete(`/api/families/${familyId}/rewards/${rewardId}`)
}

// --- Redemptions ---

export async function getRedemptions(familyId: string): Promise<Redemption[]> {
  const { data } = await apiClient.get<Redemption[]>(`/api/families/${familyId}/redemptions`)
  return data
}

export async function redeemReward(familyId: string, rewardId: string): Promise<Redemption> {
  const { data } = await apiClient.post<Redemption>(`/api/families/${familyId}/redemptions`, {
    rewardId,
  })
  return data
}

export async function fulfillRedemption(
  familyId: string,
  redemptionId: string,
): Promise<Redemption> {
  const { data } = await apiClient.patch<Redemption>(
    `/api/families/${familyId}/redemptions/${redemptionId}/fulfill`,
  )
  return data
}

export async function cancelRedemption(
  familyId: string,
  redemptionId: string,
): Promise<Redemption> {
  const { data } = await apiClient.patch<Redemption>(
    `/api/families/${familyId}/redemptions/${redemptionId}/cancel`,
  )
  return data
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/api/rewards.ts
git commit -m "feat: add rewards and redemptions API functions"
```

---

## Task 2: Parent Components — RewardList, RewardModal, PendingRedemptions

**Files:**
- Create: `src/components/RewardList.tsx`
- Create: `src/components/RewardModal.tsx`
- Create: `src/components/PendingRedemptions.tsx`

- [ ] **Step 1: Create RewardModal**

Create `src/components/RewardModal.tsx`:

```tsx
import { useState, useEffect } from 'react'
import type { Reward, CreateRewardInput } from '../api/rewards'

interface RewardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (input: CreateRewardInput) => Promise<void>
  reward?: Reward | null
}

export default function RewardModal({ isOpen, onClose, onSave, reward }: RewardModalProps) {
  const [name, setName] = useState('')
  const [pointCost, setPointCost] = useState(10)
  const [icon, setIcon] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (reward) {
      setName(reward.name)
      setPointCost(reward.pointCost)
      setIcon(reward.icon || '')
      setDescription(reward.description || '')
    } else {
      setName('')
      setPointCost(10)
      setIcon('')
      setDescription('')
    }
    setError('')
  }, [reward, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    if (pointCost < 1) { setError('Point cost must be at least 1'); return }
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        pointCost,
        icon: icon.trim() || undefined,
        description: description.trim() || undefined,
      })
      onClose()
    } catch {
      setError('Failed to save reward')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-extrabold text-accent mb-4">
          {reward ? 'Edit Reward' : 'New Reward'}
        </h2>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-2 rounded-xl mb-3">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Reward name" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <div className="flex gap-3">
            <input type="number" placeholder="Point cost" min={1} value={pointCost} onChange={(e) => setPointCost(Number(e.target.value))}
              className="flex-1 bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="text" placeholder="Icon (emoji)" value={icon} onChange={(e) => setIcon(e.target.value)}
              className="w-24 bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <input type="text" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-full transition-colors">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-full transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create RewardList**

Create `src/components/RewardList.tsx`:

```tsx
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
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-accent">🎁 Rewards</h3>
        <button onClick={onNew}
          className="bg-primary hover:bg-primary-dark text-white text-xs font-bold py-1.5 px-4 rounded-full transition-colors">
          + New
        </button>
      </div>
      {rewards.length === 0 ? (
        <p className="text-gray-400 text-sm">No rewards yet — create one for your kids</p>
      ) : (
        <div className="space-y-2">
          {rewards.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span>{r.icon || '🎁'}</span>
                <span className="font-semibold text-sm">{r.name}</span>
                <span className="text-accent text-xs font-bold">{r.pointCost}pts</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(r)} className="text-sm hover:scale-110 transition-transform" title="Edit">✏️</button>
                <button onClick={() => onDelete(r.id)} className="text-sm hover:scale-110 transition-transform" title="Delete">🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create PendingRedemptions**

Create `src/components/PendingRedemptions.tsx`:

```tsx
import { useState } from 'react'
import type { Redemption } from '../api/rewards'
import { fulfillRedemption, cancelRedemption } from '../api/rewards'

interface PendingRedemptionsProps {
  redemptions: Redemption[]
  familyId: string
  loading: boolean
  onAction: () => void
}

export default function PendingRedemptions({ redemptions, familyId, loading, onAction }: PendingRedemptionsProps) {
  const [actingOn, setActingOn] = useState<string | null>(null)

  const pending = redemptions.filter((r) => r.status === 'pending')

  const handleFulfill = async (id: string) => {
    setActingOn(id)
    try { await fulfillRedemption(familyId, id); onAction() } catch {}
    finally { setActingOn(null) }
  }

  const handleCancel = async (id: string) => {
    setActingOn(id)
    try { await cancelRedemption(familyId, id); onAction() } catch {}
    finally { setActingOn(null) }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-10 bg-gray-100 rounded mb-2" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">⏳ Pending Redemptions ({pending.length})</h3>
      {pending.length === 0 ? (
        <p className="text-gray-400 text-sm">No pending redemptions 🎉</p>
      ) : (
        <div className="space-y-2">
          {pending.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <div>
                <span className="font-semibold text-sm">{r.redeemedBy.name}</span>
                <span className="text-gray-400 text-sm"> — {r.reward.icon || '🎁'} {r.reward.name}</span>
                <span className="text-accent text-xs font-bold ml-2">{r.pointsSpent}pts</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleFulfill(r.id)} disabled={actingOn === r.id}
                  className="text-lg hover:scale-110 transition-transform disabled:opacity-50" title="Fulfill">✅</button>
                <button onClick={() => handleCancel(r.id)} disabled={actingOn === r.id}
                  className="text-lg hover:scale-110 transition-transform disabled:opacity-50" title="Cancel">❌</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add src/components/RewardList.tsx src/components/RewardModal.tsx src/components/PendingRedemptions.tsx
git commit -m "feat: add RewardList, RewardModal, PendingRedemptions components"
```

---

## Task 3: Child Components — AvailableRewards, MyRedemptions

**Files:**
- Create: `src/components/AvailableRewards.tsx`
- Create: `src/components/MyRedemptions.tsx`

- [ ] **Step 1: Create AvailableRewards**

Create `src/components/AvailableRewards.tsx`:

```tsx
import { useState } from 'react'
import type { Reward } from '../api/rewards'
import { redeemReward } from '../api/rewards'

interface AvailableRewardsProps {
  rewards: Reward[]
  familyId: string
  balance: number
  loading: boolean
  onRedeem: () => void
}

export default function AvailableRewards({ rewards, familyId, balance, loading, onRedeem }: AvailableRewardsProps) {
  const [redeeming, setRedeeming] = useState<string | null>(null)

  const handleRedeem = async (rewardId: string) => {
    setRedeeming(rewardId)
    try { await redeemReward(familyId, rewardId); onRedeem() } catch {}
    finally { setRedeeming(null) }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-28 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">🎁 Rewards</h3>
      {rewards.length === 0 ? (
        <p className="text-gray-400 text-sm">No rewards available yet</p>
      ) : (
        <div className="space-y-2">
          {rewards.map((r) => {
            const canAfford = balance >= r.pointCost
            const deficit = r.pointCost - balance
            return (
              <div key={r.id} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{r.icon || '🎁'}</span>
                  <div>
                    <div className="font-semibold text-sm">{r.name}</div>
                    <div className="text-accent text-xs font-bold">{r.pointCost}pts</div>
                  </div>
                </div>
                {canAfford ? (
                  <button
                    onClick={() => handleRedeem(r.id)}
                    disabled={redeeming === r.id}
                    className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-xs font-bold py-1.5 px-4 rounded-full transition-colors"
                  >
                    {redeeming === r.id ? '...' : 'Redeem'}
                  </button>
                ) : (
                  <span className="text-gray-400 text-xs font-semibold">Need {deficit} more</span>
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

- [ ] **Step 2: Create MyRedemptions**

Create `src/components/MyRedemptions.tsx`:

```tsx
import { useState } from 'react'
import type { Redemption } from '../api/rewards'
import { cancelRedemption } from '../api/rewards'

interface MyRedemptionsProps {
  redemptions: Redemption[]
  familyId: string
  loading: boolean
  onCancel: () => void
}

export default function MyRedemptions({ redemptions, familyId, loading, onCancel }: MyRedemptionsProps) {
  const [cancelling, setCancelling] = useState<string | null>(null)

  const handleCancel = async (id: string) => {
    setCancelling(id)
    try { await cancelRedemption(familyId, id); onCancel() } catch {}
    finally { setCancelling(null) }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-36 bg-gray-200 rounded mb-4" />
        <div className="h-10 bg-gray-100 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h3 className="font-bold text-accent mb-3">📦 My Redemptions</h3>
      {redemptions.length === 0 ? (
        <p className="text-gray-400 text-sm">No redemptions yet</p>
      ) : (
        <div className="space-y-2">
          {redemptions.map((r) => {
            const statusIcon = r.status === 'fulfilled' ? '✅' : r.status === 'cancelled' ? '❌' : '🟡'
            const statusColor = r.status === 'fulfilled' ? 'text-green-600' : r.status === 'cancelled' ? 'text-red-400' : 'text-orange-500'
            return (
              <div key={r.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span>{r.reward.icon || '🎁'}</span>
                  <div>
                    <span className="font-semibold text-sm">{r.reward.name}</span>
                    <span className="text-accent text-xs font-bold ml-2">{r.pointsSpent}pts</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold capitalize ${statusColor}`}>
                    {statusIcon} {r.status}
                  </span>
                  {r.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(r.id)}
                      disabled={cancelling === r.id}
                      className="text-xs text-red-400 hover:text-red-600 font-semibold disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/AvailableRewards.tsx src/components/MyRedemptions.tsx
git commit -m "feat: add AvailableRewards and MyRedemptions child components"
```

---

## Task 4: RewardsManagement Page

**Files:**
- Create: `src/pages/RewardsManagement.tsx`

- [ ] **Step 1: Create RewardsManagement page**

Create `src/pages/RewardsManagement.tsx`:

```tsx
import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { getRewards, createReward, updateReward, deleteReward, getRedemptions } from '../api/rewards'
import type { Reward, Redemption, CreateRewardInput } from '../api/rewards'
import Header from '../components/Header'
import NavBar from '../components/NavBar'
import RewardList from '../components/RewardList'
import RewardModal from '../components/RewardModal'
import PendingRedemptions from '../components/PendingRedemptions'

export default function RewardsManagement() {
  const user = useAuthStore((s) => s.user)
  const familyId = user?.familyId

  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loadingRewards, setLoadingRewards] = useState(true)
  const [loadingRedemptions, setLoadingRedemptions] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)

  const fetchRewards = useCallback(async () => {
    if (!familyId) return
    setLoadingRewards(true)
    try { setRewards(await getRewards(familyId)) } catch {}
    finally { setLoadingRewards(false) }
  }, [familyId])

  const fetchRedemptions = useCallback(async () => {
    if (!familyId) return
    setLoadingRedemptions(true)
    try { setRedemptions(await getRedemptions(familyId)) } catch {}
    finally { setLoadingRedemptions(false) }
  }, [familyId])

  useEffect(() => {
    fetchRewards()
    fetchRedemptions()
  }, [fetchRewards, fetchRedemptions])

  const handleSaveReward = async (input: CreateRewardInput) => {
    if (!familyId) return
    if (editingReward) {
      await updateReward(familyId, editingReward.id, input)
    } else {
      await createReward(familyId, input)
    }
    fetchRewards()
  }

  const handleDeleteReward = async (rewardId: string) => {
    if (!familyId) return
    await deleteReward(familyId, rewardId)
    fetchRewards()
  }

  const handleRedemptionAction = () => {
    fetchRedemptions()
  }

  if (!familyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">Create or join a family first.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <NavBar />

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <RewardList
          rewards={rewards}
          loading={loadingRewards}
          onNew={() => { setEditingReward(null); setModalOpen(true) }}
          onEdit={(r) => { setEditingReward(r); setModalOpen(true) }}
          onDelete={handleDeleteReward}
        />

        <PendingRedemptions
          redemptions={redemptions}
          familyId={familyId}
          loading={loadingRedemptions}
          onAction={handleRedemptionAction}
        />
      </main>

      <RewardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveReward}
        reward={editingReward}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/RewardsManagement.tsx
git commit -m "feat: add RewardsManagement page for parents"
```

---

## Task 5: Add Rewards to ChildHome

**Files:**
- Modify: `src/pages/ChildHome.tsx`

- [ ] **Step 1: Update ChildHome to include rewards sections**

In `src/pages/ChildHome.tsx`, add these imports near the top:

```typescript
import { getRewards, getRedemptions } from '../api/rewards'
import type { Reward, Redemption } from '../api/rewards'
import AvailableRewards from '../components/AvailableRewards'
import MyRedemptions from '../components/MyRedemptions'
```

Add these state variables inside the `ChildHome` component (alongside the existing ones):

```typescript
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loadingRewards, setLoadingRewards] = useState(true)
  const [loadingRedemptions, setLoadingRedemptions] = useState(true)
```

Add these fetch functions (alongside the existing ones):

```typescript
  const fetchRewards = useCallback(async () => {
    if (!familyId) return
    setLoadingRewards(true)
    try { setRewards(await getRewards(familyId)) } catch {}
    finally { setLoadingRewards(false) }
  }, [familyId])

  const fetchRedemptions = useCallback(async () => {
    if (!familyId) return
    setLoadingRedemptions(true)
    try { setRedemptions(await getRedemptions(familyId)) } catch {}
    finally { setLoadingRedemptions(false) }
  }, [familyId])
```

Add `fetchRewards` and `fetchRedemptions` to the existing `useEffect`:

```typescript
  useEffect(() => {
    fetchChores()
    fetchPoints()
    fetchLeaderboard()
    fetchRewards()
    fetchRedemptions()
  }, [fetchChores, fetchPoints, fetchLeaderboard, fetchRewards, fetchRedemptions])
```

Update `handleComplete` to also refresh rewards data:

```typescript
  const handleComplete = () => {
    fetchChores()
    fetchPoints()
    fetchLeaderboard()
  }

  const handleRedeem = () => {
    fetchPoints()
    fetchRewards()
    fetchRedemptions()
  }

  const handleCancelRedemption = () => {
    fetchPoints()
    fetchRedemptions()
  }
```

Add these two components at the bottom of the `<main>` section, after `<Leaderboard />`:

```tsx
        {/* Available Rewards */}
        <AvailableRewards
          rewards={rewards}
          familyId={familyId}
          balance={balance}
          loading={loadingRewards}
          onRedeem={handleRedeem}
        />

        {/* My Redemptions */}
        <MyRedemptions
          redemptions={redemptions}
          familyId={familyId}
          loading={loadingRedemptions}
          onCancel={handleCancelRedemption}
        />
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/pages/ChildHome.tsx
git commit -m "feat: add rewards and redemptions sections to ChildHome"
```

---

## Task 6: Enable Rewards Tab + Wire Route

**Files:**
- Modify: `src/components/NavBar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Enable Rewards tab in NavBar**

In `src/components/NavBar.tsx`, remove the `disabled: true` from the Rewards tab. Change:

```typescript
  { label: 'Rewards', path: '/rewards', icon: '🎁', disabled: true },
```

To:

```typescript
  { label: 'Rewards', path: '/rewards', icon: '🎁' },
```

- [ ] **Step 2: Add /rewards route to App.tsx**

In `src/App.tsx`, add the import:

```typescript
import RewardsManagement from './pages/RewardsManagement'
```

Add the route inside the protected routes block:

```tsx
<Route path="/rewards" element={<RewardsManagement />} />
```

So it becomes:

```tsx
<Route element={<ProtectedRoute />}>
  <Route path="/home" element={<Home />} />
  <Route path="/chores" element={<ChoreManagement />} />
  <Route path="/rewards" element={<RewardsManagement />} />
</Route>
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add src/components/NavBar.tsx src/App.tsx
git commit -m "feat: enable Rewards tab and wire /rewards route"
```

---

## Task 7: Smoke Test

- [ ] **Step 1: Ensure backend + frontend running, seed database**

- [ ] **Step 2: Test parent rewards flow**

1. Log in as parent → navigate to Rewards tab
2. Should see seed rewards (Screen time, Pick dinner, Movie night pick)
3. Create a new reward via "+ New"
4. Edit/delete rewards
5. If any pending redemptions exist, fulfill/cancel them

- [ ] **Step 3: Test child rewards flow**

Child login not available via UI (PIN login), but can test by:
- Creating a test child user via the register flow, or
- Checking the AvailableRewards and MyRedemptions components render correctly for the parent view (they'll show on ChildHome when a child logs in)

- [ ] **Step 4: Fix any issues**

```bash
git add -A
git commit -m "fix: address smoke test findings"
```
