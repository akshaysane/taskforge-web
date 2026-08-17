import apiClient from './client'

export type MeasurementMatchMode = 'AT_LEAST_WITHIN_TOLERANCE' | 'RANGE_MIN' | 'RANGE_MAX' | 'NEAREST_WITHIN_TOLERANCE' | 'INFORMATIONAL'

export const matchModeLabels: Record<MeasurementMatchMode, string> = {
  AT_LEAST_WITHIN_TOLERANCE: 'At least within tolerance',
  RANGE_MIN: 'Range minimum',
  RANGE_MAX: 'Range maximum',
  NEAREST_WITHIN_TOLERANCE: 'Nearest within tolerance',
  INFORMATIONAL: 'Informational only',
}

export interface PieceType {
  id: string
  code: string
  name: string
  description: string | null
  active: boolean
  sortOrder: number
}

export interface MeasurementDefinition {
  id: string
  pieceTypeId: string
  code: string
  label: string
  unit: 'INCH'
  matchMode: MeasurementMatchMode
  matchingGroup: string | null
  defaultTolerance: string | null
  requiredForItem: boolean
  sortOrder: number
  active: boolean
}

export interface PieceTypeInput { code: string; name: string; description?: string; sortOrder?: number; active?: boolean }
export interface MeasurementDefinitionInput {
  code: string; label: string; unit: 'INCH'; matchMode: MeasurementMatchMode; matchingGroup?: string | null
  defaultTolerance?: string | null; requiredForItem: boolean; sortOrder?: number; active?: boolean
}

type MeasurementWire = Omit<MeasurementDefinition, 'defaultTolerance'> & { defaultTolerance: number | null }

function fromWire(definition: MeasurementWire): MeasurementDefinition {
  return { ...definition, defaultTolerance: definition.defaultTolerance === null ? null : String(definition.defaultTolerance) }
}

function measurementBody(input: MeasurementDefinitionInput) {
  const { defaultTolerance, ...rest } = input
  return {
    ...rest,
    ...(defaultTolerance === undefined || defaultTolerance === '' ? {} : { defaultTolerance: Number(defaultTolerance) }),
  }
}

export async function listPieceTypes(): Promise<PieceType[]> {
  return (await apiClient.get<PieceType[]>('/api/piece-types')).data
}

export async function createPieceType(input: PieceTypeInput): Promise<PieceType> {
  return (await apiClient.post<PieceType>('/api/piece-types', input)).data
}

export async function updatePieceType(pieceTypeId: string, input: Partial<PieceTypeInput>): Promise<PieceType> {
  return (await apiClient.patch<PieceType>(`/api/piece-types/${pieceTypeId}`, input)).data
}

export async function listMeasurementDefinitions(pieceTypeId: string): Promise<MeasurementDefinition[]> {
  const response = await apiClient.get<MeasurementWire[]>(`/api/piece-types/${pieceTypeId}/measurement-definitions`)
  return response.data.map(fromWire)
}

export async function createMeasurementDefinition(pieceTypeId: string, input: MeasurementDefinitionInput): Promise<MeasurementDefinition> {
  const response = await apiClient.post<MeasurementWire>(`/api/piece-types/${pieceTypeId}/measurement-definitions`, measurementBody(input))
  return fromWire(response.data)
}

export async function updateMeasurementDefinition(definitionId: string, input: Partial<MeasurementDefinitionInput>): Promise<MeasurementDefinition> {
  const response = await apiClient.patch<MeasurementWire>(`/api/measurement-definitions/${definitionId}`, measurementBody(input as MeasurementDefinitionInput))
  return fromWire(response.data)
}
