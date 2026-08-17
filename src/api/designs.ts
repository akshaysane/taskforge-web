import axios from 'axios'
import apiClient from './client'

export interface DesignPieceRequirement {
  id?: string
  designId?: string
  pieceTypeId: string
  quantity: number
  required: boolean
  sortOrder: number
  pieceType?: { id: string; code: string; name: string }
}

export interface Design {
  id: string
  designCode: string
  name: string
  costumeType: string
  primaryColor: string | null
  secondaryColor: string | null
  description: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
  pieceRequirements: DesignPieceRequirement[]
}

export interface DesignInput {
  designCode: string
  name: string
  costumeType: string
  primaryColor?: string | null
  secondaryColor?: string | null
  description?: string | null
}

export interface ApiError {
  message: string
  fieldErrors: Record<string, string>
}

export function apiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; fieldErrors?: Record<string, string> } | undefined
    return { message: data?.message ?? 'Something went wrong. Please try again.', fieldErrors: data?.fieldErrors ?? {} }
  }
  return { message: 'Something went wrong. Please try again.', fieldErrors: {} }
}

function compact<T extends object>(input: T): Record<string, string> {
  return Object.fromEntries(Object.entries(input).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== ''))
}

export async function listDesigns(): Promise<Design[]> {
  return (await apiClient.get<Design[]>('/api/designs')).data
}

export async function getDesign(designId: string): Promise<Design> {
  return (await apiClient.get<Design>(`/api/designs/${designId}`)).data
}

export async function createDesign(input: DesignInput): Promise<Design> {
  return (await apiClient.post<Design>('/api/designs', compact(input))).data
}

export async function updateDesign(designId: string, input: Omit<DesignInput, 'designCode'>): Promise<Design> {
  return (await apiClient.patch<Design>(`/api/designs/${designId}`, compact(input))).data
}

export async function replaceDesignRequirements(designId: string, requirements: DesignPieceRequirement[]): Promise<DesignPieceRequirement[]> {
  const body = requirements.map(({ pieceTypeId, quantity, required, sortOrder }) => ({ pieceTypeId, quantity, required, sortOrder }))
  return (await apiClient.put<DesignPieceRequirement[]>(`/api/designs/${designId}/piece-requirements`, { requirements: body })).data
}
