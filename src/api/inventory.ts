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

export interface InventoryItemUpdate {
  version: number
  customSize?: string | null
  condition?: string
  storageLocation?: string | null
  notes?: string | null
  alterationAllowance?: string | null
  purchaseCost?: string | null
  stitchingCost?: string | null
  measurements: Array<{ measurementDefinitionId: string; value: string }>
}

export async function updateInventoryItem(inventoryItemId: string, input: InventoryItemUpdate): Promise<InventoryItem> {
  return (await apiClient.patch<InventoryItem>(`/api/inventory-items/${inventoryItemId}`, input)).data
}
