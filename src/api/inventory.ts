import apiClient from './client'
import type { MediaLink } from './media'
import { createRequestId } from '../lib/requestId'

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
  media?: MediaLink[]
  pieceType?: { id: string; code: string; name: string }
  originalSet?: { id: string; originalSetCode: string; designId: string; sequenceNumber: number; design: { id: string; designCode: string; name: string; costumeType: string; primaryColor: string | null; secondaryColor: string | null } }
}

export interface InventorySearchParams {
  query?: string; designId?: string; primaryColor?: string; secondaryColor?: string; pieceTypeId?: string; originalSetId?: string
  lifecycleStatus?: string; availability?: 'AVAILABLE' | 'UNAVAILABLE'; condition?: string; customSize?: string; storageLocation?: string
  measurement?: string[]; cursor?: string; limit?: number
}

export interface InventoryEvent { id: string; inventoryItemId: string; eventType: string; actorUserId: string; rentalId: string | null; metadata: unknown; occurredAt: string }

export interface InventoryItemCreate {
  originalSetId: string; pieceTypeId: string; pieceSequence: number; customSize?: string | null; condition?: string; storageLocation?: string | null
  notes?: string | null; alterationAllowance?: string | null; purchaseCost?: string | null; stitchingCost?: string | null
  measurements?: Array<{ measurementDefinitionId: string; value: string }>
}

export async function getInventoryItemByCode(inventoryCode: string): Promise<InventoryItem> {
  return (await apiClient.get<InventoryItem>(`/api/inventory-items/by-code/${encodeURIComponent(inventoryCode)}`)).data
}

export async function getInventoryItem(inventoryItemId: string): Promise<InventoryItem> { return (await apiClient.get<InventoryItem>(`/api/inventory-items/${inventoryItemId}`)).data }
export async function listInventoryItems(params: InventorySearchParams): Promise<{ items: InventoryItem[]; nextCursor: string | null }> {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((entry) => query.append(key, entry))
    else if (value !== undefined && value !== '') query.set(key, String(value))
  })
  return (await apiClient.get<{ items: InventoryItem[]; nextCursor: string | null }>(`/api/inventory-items?${query}`)).data
}
export async function createInventoryItem(input: InventoryItemCreate): Promise<InventoryItem> { return (await apiClient.post<InventoryItem>('/api/inventory-items', input)).data }
export async function listInventoryEvents(inventoryItemId: string): Promise<InventoryEvent[]> { return (await apiClient.get<InventoryEvent[]>(`/api/inventory-items/${inventoryItemId}/events`)).data }
export async function transitionInventoryLifecycle(inventoryItemId: string, input: { to: string; notes?: string; expectedVersion: number }): Promise<InventoryItem> { return (await apiClient.post<InventoryItem>(`/api/inventory-items/${inventoryItemId}/lifecycle-transitions`, input)).data }

export async function recordLabelPrinted(inventoryItemId: string): Promise<void> {
  await apiClient.post(`/api/inventory-items/${inventoryItemId}/label-printed`, { requestId: createRequestId() })
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
