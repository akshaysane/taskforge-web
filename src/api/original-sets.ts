import apiClient from './client'
import type { InventoryItem } from './inventory'
import type { MediaLink } from './media'

export type OnboardingStage = 'SET' | 'PHOTO' | 'PIECES' | 'LABELS' | 'VERIFY'

export interface OriginalSetSummary {
  id: string; designId: string; originalSetCode: string; sequenceNumber: number; notes: string | null
  verifiedAt: string | null; verifiedById: string | null; archivedAt: string | null; createdAt: string; updatedAt: string; inventoryItemCount: number
  onboarding: { stage: Exclude<OnboardingStage, 'SET'>; progressPercent: number; expectedItemCount: number; generatedExpectedItemCount: number; activeItemCount: number; referencePhotoCount: number; requiredMeasurementCount: number; completedRequiredMeasurementCount: number; labelVerifiedCount: number }
}

export interface OnboardingMeasurementDefinition {
  id: string; pieceTypeId: string; code: string; label: string; unit: 'INCH'; matchMode: string; matchingGroup: string | null
  defaultTolerance: string | null; requiredForItem: boolean; sortOrder: number; active: boolean
}

export interface OriginalSetDetail extends OriginalSetSummary {
  design: { id: string; designCode: string; name: string; costumeType: string; primaryColor: string | null; secondaryColor: string | null; pieceRequirements: Array<{ id: string; designId: string; pieceTypeId: string; quantity: number; required: boolean; sortOrder: number; pieceType: { id: string; code: string; name: string; measurementDefinitions: OnboardingMeasurementDefinition[] } }> }
  inventoryItems: Array<InventoryItem & { labelVerified: boolean }>
  media: MediaLink[]
}

export async function listOriginalSets(): Promise<OriginalSetSummary[]> { return (await apiClient.get<OriginalSetSummary[]>('/api/original-sets')).data }
export async function getOriginalSet(originalSetId: string): Promise<OriginalSetDetail> { return (await apiClient.get<OriginalSetDetail>(`/api/original-sets/${originalSetId}`)).data }
export async function createOriginalSet(input: { designId: string; notes?: string }): Promise<OriginalSetSummary> { return (await apiClient.post<OriginalSetSummary>('/api/original-sets', input)).data }
export async function generateExpectedItems(originalSetId: string): Promise<{ created: number; existing: number }> { return (await apiClient.post<{ created: number; existing: number }>(`/api/original-sets/${originalSetId}/generate-items`)).data }
export async function verifyOriginalSet(originalSetId: string): Promise<OriginalSetDetail> { return (await apiClient.post<OriginalSetDetail>(`/api/original-sets/${originalSetId}/verify`)).data }
export async function archiveOriginalSet(originalSetId: string): Promise<void> { await apiClient.delete(`/api/original-sets/${originalSetId}`) }
