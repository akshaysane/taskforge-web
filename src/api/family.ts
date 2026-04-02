import apiClient from './client'

export interface Family {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  users: { id: string; name: string; role: string; avatarUrl: string | null; email: string | null }[]
}

export interface FamilyMember {
  id: string
  name: string
  role: string
  avatarUrl: string | null
  email: string | null
}

export async function createFamily(name: string): Promise<Family> {
  const { data } = await apiClient.post<Family>('/api/families', { name })
  return data
}

export async function getFamily(familyId: string): Promise<Family> {
  const { data } = await apiClient.get<Family>(`/api/families/${familyId}`)
  return data
}

export async function updateFamily(familyId: string, name: string): Promise<Family> {
  const { data } = await apiClient.patch<Family>(`/api/families/${familyId}`, { name })
  return data
}

export async function addChild(
  familyId: string,
  input: { name: string; pin: string },
): Promise<FamilyMember> {
  const { data } = await apiClient.post<FamilyMember>(
    `/api/families/${familyId}/members`,
    input,
  )
  return data
}

export async function getMembers(familyId: string): Promise<FamilyMember[]> {
  const { data } = await apiClient.get<FamilyMember[]>(`/api/families/${familyId}/members`)
  return data
}

export async function updateMember(
  familyId: string,
  userId: string,
  input: { name?: string; pin?: string },
): Promise<FamilyMember> {
  const { data } = await apiClient.patch<FamilyMember>(
    `/api/families/${familyId}/members/${userId}`,
    input,
  )
  return data
}

export async function removeMember(familyId: string, userId: string): Promise<void> {
  await apiClient.delete(`/api/families/${familyId}/members/${userId}`)
}
