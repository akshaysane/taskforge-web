import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import {
  getTodayChores,
  getPointsBalance,
  getFamilyMembers,
} from '../api/chores'
import type { ChoreInstance } from '../api/chores'
import { getRewards, getRedemptions } from '../api/rewards'
import type { Reward, Redemption } from '../api/rewards'
import Header from '../components/Header'
import PointsCard from '../components/PointsCard'
import StreakCard from '../components/StreakCard'
import ChoreChecklist from '../components/ChoreChecklist'
import Leaderboard from '../components/Leaderboard'
import AvailableRewards from '../components/AvailableRewards'
import MyRedemptions from '../components/MyRedemptions'

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
  const [rewards, setRewards] = useState<Reward[]>([])
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loadingRewards, setLoadingRewards] = useState(true)
  const [loadingRedemptions, setLoadingRedemptions] = useState(true)

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
    fetchChores()
    fetchPoints()
    fetchLeaderboard()
    fetchRewards()
    fetchRedemptions()
  }, [fetchChores, fetchPoints, fetchLeaderboard, fetchRewards, fetchRedemptions])

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
        <AvailableRewards rewards={rewards} familyId={familyId} balance={balance}
          loading={loadingRewards} onRedeem={handleRedeem} />
        <MyRedemptions redemptions={redemptions} familyId={familyId}
          loading={loadingRedemptions} onCancel={handleCancelRedemption} />
      </main>
    </div>
  )
}
