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

// --- Template types ---

export interface ChoreTemplate {
  id: string
  name: string
  description: string | null
  icon: string | null
  points: number
  requiresApproval: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateInput {
  name: string
  description?: string
  icon?: string
  points?: number
  requiresApproval?: boolean
}

// --- Schedule types ---

export interface ChoreSchedule {
  id: string
  daysOfWeek: number
  effectiveFrom: string
  effectiveUntil: string | null
  isActive: boolean
  choreTemplate: { id: string; name: string; points: number }
  assignedTo: { id: string; name: string }
}

export interface CreateScheduleInput {
  choreTemplateId: string
  assignedToId: string
  daysOfWeek: number
  effectiveFrom: string
  effectiveUntil?: string
}

// --- Generate types ---

export interface GenerateResult {
  created: number
  skipped: number
}

// --- Template API ---

export async function getTemplates(familyId: string): Promise<ChoreTemplate[]> {
  const { data } = await apiClient.get<ChoreTemplate[]>(`/api/families/${familyId}/chore-templates`)
  return data
}

export async function createTemplate(familyId: string, input: CreateTemplateInput): Promise<ChoreTemplate> {
  const { data } = await apiClient.post<ChoreTemplate>(`/api/families/${familyId}/chore-templates`, input)
  return data
}

export async function updateTemplate(familyId: string, templateId: string, input: Partial<CreateTemplateInput>): Promise<ChoreTemplate> {
  const { data } = await apiClient.patch<ChoreTemplate>(`/api/families/${familyId}/chore-templates/${templateId}`, input)
  return data
}

export async function deleteTemplate(familyId: string, templateId: string): Promise<void> {
  await apiClient.delete(`/api/families/${familyId}/chore-templates/${templateId}`)
}

// --- Schedule API ---

export async function getSchedules(familyId: string): Promise<ChoreSchedule[]> {
  const { data } = await apiClient.get<ChoreSchedule[]>(`/api/families/${familyId}/chore-schedules`)
  return data
}

export async function createSchedule(familyId: string, input: CreateScheduleInput): Promise<ChoreSchedule> {
  const { data } = await apiClient.post<ChoreSchedule>(`/api/families/${familyId}/chore-schedules`, input)
  return data
}

export async function updateSchedule(familyId: string, scheduleId: string, input: { daysOfWeek?: number; effectiveUntil?: string; isActive?: boolean }): Promise<ChoreSchedule> {
  const { data } = await apiClient.patch<ChoreSchedule>(`/api/families/${familyId}/chore-schedules/${scheduleId}`, input)
  return data
}

export async function deleteSchedule(familyId: string, scheduleId: string): Promise<void> {
  await apiClient.delete(`/api/families/${familyId}/chore-schedules/${scheduleId}`)
}

// --- Generate API ---

export async function generateChores(familyId: string): Promise<GenerateResult> {
  const { data } = await apiClient.post<GenerateResult>(`/api/families/${familyId}/chores/generate`)
  return data
}

export interface StreakResult {
  userId: string
  streak: number
}

export async function getStreak(familyId: string, userId: string): Promise<StreakResult> {
  const { data } = await apiClient.get<StreakResult>(
    `/api/families/${familyId}/members/${userId}/streak`,
  )
  return data
}

// --- Achievement types ---

export interface Achievement {
  key: string
  name: string
  icon: string
  description: string
  unlockedAt: string
}

export async function getAchievements(familyId: string, userId: string): Promise<Achievement[]> {
  const { data } = await apiClient.get<Achievement[]>(
    `/api/families/${familyId}/members/${userId}/achievements`,
  )
  return data
}

export async function checkAchievements(familyId: string, userId: string): Promise<Achievement[]> {
  const { data } = await apiClient.post<Achievement[]>(
    `/api/families/${familyId}/members/${userId}/achievements/check`,
  )
  return data
}
