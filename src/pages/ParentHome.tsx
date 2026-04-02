import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import {
  getTodayChores,
  getPendingApprovals,
  getPointsBalance,
  getFamilyMembers,
} from '../api/chores'
import type { ChoreInstance, FamilyMember } from '../api/chores'
import Header from '../components/Header'
import NavBar from '../components/NavBar'
import TodayProgress from '../components/TodayProgress'
import PendingApprovals from '../components/PendingApprovals'
import FamilyMembers from '../components/FamilyMembers'

interface MemberWithStats extends FamilyMember {
  balance: number
  choresDone: number
  choresTotal: number
}

export default function ParentHome() {
  const navigate = useNavigate()
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

  useEffect(() => {
    if (!familyId) {
      navigate('/settings', { replace: true })
    }
  }, [familyId, navigate])

  if (!familyId) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <NavBar />
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
