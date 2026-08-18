import apiClient from './client'
export interface AdminUser { id: string; email: string; name: string; role: 'ADMIN'; active: boolean; createdAt: string; updatedAt: string }
export async function listAdminUsers(): Promise<AdminUser[]> { return (await apiClient.get<AdminUser[]>('/api/admin-users')).data }
export async function createAdminUser(input: { name: string; email: string; password: string }): Promise<AdminUser> { return (await apiClient.post<AdminUser>('/api/admin-users', input)).data }
export async function updateAdminUser(id: string, input: Partial<{ name: string; email: string; password: string; active: boolean }>): Promise<AdminUser> { return (await apiClient.patch<AdminUser>(`/api/admin-users/${id}`, input)).data }
