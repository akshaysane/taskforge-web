import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { expect, test } from 'vitest'
import InventoryCreate from './InventoryCreate'
import { server } from '../test/server'

const setId = '11111111-1111-4111-8111-111111111111'; const pieceTypeId = '22222222-2222-4222-8222-222222222222'
function Destination() { return <p>Created code: {useParams().inventoryCode}</p> }

test('creates a standalone item from permanent identity inputs and opens its server-generated code', async () => {
  let body: Record<string, unknown> | undefined
  server.use(
    http.get('*/api/original-sets', () => HttpResponse.json([{ id: setId, designId: 'design', originalSetCode: 'YP-S04', sequenceNumber: 4, notes: null, verifiedAt: null, verifiedById: null, archivedAt: null, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z', inventoryItemCount: 0, onboarding: { stage: 'PIECES', progressPercent: 25, expectedItemCount: 1, generatedExpectedItemCount: 1, activeItemCount: 1, referencePhotoCount: 1, requiredMeasurementCount: 0, completedRequiredMeasurementCount: 0, labelVerifiedCount: 0 } }])),
    http.get('*/api/piece-types', () => HttpResponse.json([{ id: pieceTypeId, code: 'BL', name: 'Blouse', description: null, active: true, sortOrder: 1 }])),
    http.get(`*/api/piece-types/${pieceTypeId}/measurement-definitions`, () => HttpResponse.json([{ id: '33333333-3333-4333-8333-333333333333', pieceTypeId, code: 'BUST', label: 'Bust', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: true, sortOrder: 1, active: true }])),
    http.post('*/api/inventory-items', async ({ request }) => { body = await request.json() as Record<string, unknown>; return HttpResponse.json({ inventoryCode: 'YP-S04-BL-03' }, { status: 201 }) }),
  )
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/inventory/new']}><Routes><Route path="/inventory/new" element={<InventoryCreate />} /><Route path="/inventory/:inventoryCode" element={<Destination />} /></Routes></MemoryRouter>)
  await user.selectOptions(await screen.findByLabelText(/original set/i), setId)
  await user.selectOptions(screen.getByLabelText(/piece type/i), pieceTypeId)
  await user.type(await screen.findByLabelText(/bust/i), '34')
  await user.clear(screen.getByLabelText(/piece sequence/i)); await user.type(screen.getByLabelText(/piece sequence/i), '3')
  await user.click(screen.getByRole('button', { name: /create inventory item/i }))
  expect(body).toMatchObject({ originalSetId: setId, pieceTypeId, pieceSequence: 3, measurements: [{ measurementDefinitionId: '33333333-3333-4333-8333-333333333333', value: '34' }] })
  expect(await screen.findByText('Created code: YP-S04-BL-03')).toBeVisible()
})

test('blocks creation while required definitions are loading or unavailable', async () => {
  server.use(http.get('*/api/original-sets', () => HttpResponse.json([])), http.get('*/api/piece-types', () => HttpResponse.json([{ id: pieceTypeId, code: 'BL', name: 'Blouse', description: null, active: true, sortOrder: 1 }])), http.get(`*/api/piece-types/${pieceTypeId}/measurement-definitions`, () => HttpResponse.json({ message: 'Definitions unavailable.' }, { status: 500 })))
  const user = userEvent.setup(); render(<MemoryRouter><InventoryCreate /></MemoryRouter>)
  await user.selectOptions(await screen.findByLabelText(/piece type/i), pieceTypeId)
  expect(screen.getByRole('button', { name: /create inventory item/i })).toBeDisabled()
  expect(await screen.findByText('Definitions unavailable.')).toBeVisible()
})

test('disables creation until a slow required-definition request resolves and its value is provided', async () => {
  let resolveDefinitions: ((response: Response) => void) | undefined
  server.use(
    http.get('*/api/original-sets', () => HttpResponse.json([{ id: setId, designId: 'design', originalSetCode: 'YP-S04', sequenceNumber: 4, notes: null, verifiedAt: null, verifiedById: null, archivedAt: null, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z', inventoryItemCount: 0, onboarding: { stage: 'PIECES', progressPercent: 25, expectedItemCount: 1, generatedExpectedItemCount: 1, activeItemCount: 1, referencePhotoCount: 1, requiredMeasurementCount: 0, completedRequiredMeasurementCount: 0, labelVerifiedCount: 0 } }])),
    http.get('*/api/piece-types', () => HttpResponse.json([{ id: pieceTypeId, code: 'BL', name: 'Blouse', description: null, active: true, sortOrder: 1 }])),
    http.get(`*/api/piece-types/${pieceTypeId}/measurement-definitions`, () => new Promise<Response>((resolve) => { resolveDefinitions = resolve })),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><InventoryCreate /></MemoryRouter>)
  await screen.findByLabelText(/piece type/i)
  expect(screen.getByRole('button', { name: /create inventory item/i })).toBeDisabled()
  await user.selectOptions(screen.getByLabelText(/original set/i), setId)
  await user.selectOptions(screen.getByLabelText(/piece type/i), pieceTypeId)
  expect(await screen.findByRole('status')).toHaveTextContent(/loading measurement definitions/i)
  expect(screen.getByRole('button', { name: /create inventory item/i })).toBeDisabled()
  resolveDefinitions?.(HttpResponse.json([{ id: '33333333-3333-4333-8333-333333333333', pieceTypeId, code: 'BUST', label: 'Bust', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: true, sortOrder: 1, active: true }]))
  const bust = await screen.findByLabelText(/bust/i)
  expect(screen.getByRole('button', { name: /create inventory item/i })).toBeDisabled()
  await user.type(bust, '34')
  await waitFor(() => expect(screen.getByRole('button', { name: /create inventory item/i })).toBeEnabled())
})
