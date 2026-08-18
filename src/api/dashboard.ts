import apiClient from './client'

export interface InventorySummary { total: number; available: number; cleaning: number; repairRequired: number; alterationRequired: number; missing: number; retired: number; originalSets: { total: number; verified: number; incomplete: number } }
export async function getInventorySummary(): Promise<InventorySummary> { return (await apiClient.get<InventorySummary>('/api/dashboard/inventory-summary')).data }
