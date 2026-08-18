import apiClient from './client'

export interface InventoryItem {
  id: string
  originalSetId: string
  pieceTypeId: string
  pieceSequence: number
  inventoryCode: string
  lifecycleStatus: string
  condition: string
  customSize: string | null
  storageLocation: string | null
  alterationAllowance: string | null
  notes: string | null
  purchaseCost: string | null
  stitchingCost: string | null
  archivedAt: string | null
  version: number
  createdAt: string
  updatedAt: string
  measurements: Array<{ measurementDefinitionId: string; code: string; label: string; value: string }>
}

export async function getInventoryItemByCode(inventoryCode: string): Promise<InventoryItem> {
  return (await apiClient.get<InventoryItem>(`/api/inventory-items/by-code/${encodeURIComponent(inventoryCode)}`)).data
}

export async function recordLabelPrinted(inventoryItemId: string): Promise<void> {
  await apiClient.post(`/api/inventory-items/${inventoryItemId}/label-printed`, { requestId: crypto.randomUUID() })
}

export async function verifyInventoryLabel(inventoryCode: string): Promise<{ alreadyVerified: boolean }> {
  return (await apiClient.post<{ alreadyVerified: boolean }>(`/api/inventory-items/by-code/${encodeURIComponent(inventoryCode)}/verify-label`)).data
}
