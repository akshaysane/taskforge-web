import apiClient from './client'

export type MediaPurpose = 'REFERENCE' | 'ORIGINAL_SET' | 'INVENTORY_ITEM'
export type MediaOwnerType = 'design' | 'original-set' | 'inventory-item'

export interface MediaAsset {
  id: string
  objectKey: string
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
  byteSize: number
  checksum: string | null
  uploadStatus: 'PENDING' | 'READY' | 'FAILED'
  uploadedById: string
  createdAt: string
  updatedAt: string
}

export interface MediaLink {
  id: string
  mediaAssetId: string
  purpose: MediaPurpose
  caption: string | null
  sortOrder: number
  mediaAsset: MediaAsset
}

const ownerPaths: Record<MediaOwnerType, string> = {
  design: 'designs', 'original-set': 'original-sets', 'inventory-item': 'inventory-items',
}

export async function createMediaUpload(input: { mimeType: MediaAsset['mimeType']; byteSize: number }) {
  return (await apiClient.post<{ mediaAsset: MediaAsset; upload: { url: string; method: 'PUT'; headers: Record<string, string>; expiresAt: string } }>('/api/media/uploads', input)).data
}

export async function uploadPresignedFile(url: string, headers: Record<string, string>, file: File): Promise<void> {
  const response = await fetch(url, { method: 'PUT', headers, body: file })
  if (!response.ok) throw new Error('Upload failed. Please retry.')
}

export async function completeMediaUpload(mediaAssetId: string): Promise<MediaAsset> {
  return (await apiClient.post<MediaAsset>(`/api/media/${mediaAssetId}/complete`)).data
}

export async function attachMedia(ownerType: MediaOwnerType, ownerId: string, mediaAssetId: string, purpose: MediaPurpose, sortOrder: number): Promise<MediaLink> {
  return (await apiClient.post<MediaLink>(`/api/${ownerPaths[ownerType]}/${ownerId}/media/${mediaAssetId}`, { purpose, sortOrder })).data
}

export async function detachMedia(ownerType: MediaOwnerType, ownerId: string, mediaAssetId: string): Promise<void> {
  await apiClient.delete(`/api/${ownerPaths[ownerType]}/${ownerId}/media/${mediaAssetId}`)
}

export async function getMediaReadUrl(mediaAssetId: string): Promise<{ url: string; expiresAt: string }> {
  return (await apiClient.get<{ url: string; expiresAt: string }>(`/api/media/${mediaAssetId}/read`)).data
}
