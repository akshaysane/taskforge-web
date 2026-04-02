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

export async function getRewards(familyId: string): Promise<Reward[]> {
  const { data } = await apiClient.get<Reward[]>(`/api/families/${familyId}/rewards`)
  return data
}

export async function createReward(familyId: string, input: CreateRewardInput): Promise<Reward> {
  const { data } = await apiClient.post<Reward>(`/api/families/${familyId}/rewards`, input)
  return data
}

export async function updateReward(familyId: string, rewardId: string, input: Partial<CreateRewardInput>): Promise<Reward> {
  const { data } = await apiClient.patch<Reward>(`/api/families/${familyId}/rewards/${rewardId}`, input)
  return data
}

export async function deleteReward(familyId: string, rewardId: string): Promise<void> {
  await apiClient.delete(`/api/families/${familyId}/rewards/${rewardId}`)
}

export async function getRedemptions(familyId: string): Promise<Redemption[]> {
  const { data } = await apiClient.get<Redemption[]>(`/api/families/${familyId}/redemptions`)
  return data
}

export async function redeemReward(familyId: string, rewardId: string): Promise<Redemption> {
  const { data } = await apiClient.post<Redemption>(`/api/families/${familyId}/redemptions`, { rewardId })
  return data
}

export async function fulfillRedemption(familyId: string, redemptionId: string): Promise<Redemption> {
  const { data } = await apiClient.patch<Redemption>(`/api/families/${familyId}/redemptions/${redemptionId}/fulfill`)
  return data
}

export async function cancelRedemption(familyId: string, redemptionId: string): Promise<Redemption> {
  const { data } = await apiClient.patch<Redemption>(`/api/families/${familyId}/redemptions/${redemptionId}/cancel`)
  return data
}
