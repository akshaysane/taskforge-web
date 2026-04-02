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

  useEffect(() => { fetchRewards(); fetchRedemptions() }, [fetchRewards, fetchRedemptions])

  const handleSaveReward = async (input: CreateRewardInput) => {
    if (!familyId) return
    if (editingReward) { await updateReward(familyId, editingReward.id, input) }
    else { await createReward(familyId, input) }
    fetchRewards()
  }

  const handleDeleteReward = async (rewardId: string) => {
    if (!familyId) return
    await deleteReward(familyId, rewardId)
    fetchRewards()
  }

  if (!familyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Header /><main className="max-w-4xl mx-auto px-4 py-12 text-center"><p className="text-gray-500">Create or join a family first.</p></main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <NavBar />
      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <RewardList rewards={rewards} loading={loadingRewards}
          onNew={() => { setEditingReward(null); setModalOpen(true) }}
          onEdit={(r) => { setEditingReward(r); setModalOpen(true) }}
          onDelete={handleDeleteReward} />
        <PendingRedemptions redemptions={redemptions} familyId={familyId}
          loading={loadingRedemptions} onAction={fetchRedemptions} />
      </main>
      <RewardModal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        onSave={handleSaveReward} reward={editingReward} />
    </div>
  )
}
