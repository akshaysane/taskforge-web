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
