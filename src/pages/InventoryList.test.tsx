import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { expect, test } from 'vitest'
import InventoryList from './InventoryList'
import { server } from '../test/server'

const item = { id: '11111111-1111-4111-8111-111111111111', originalSetId: '22222222-2222-4222-8222-222222222222', pieceTypeId: '33333333-3333-4333-8333-333333333333', pieceSequence: 1, inventoryCode: 'YP-S04-BL-01', lifecycleStatus: 'ACTIVE', condition: 'EXCELLENT', customSize: 'M', storageLocation: 'Rack A', alterationAllowance: null, notes: null, purchaseCost: null, stitchingCost: null, archivedAt: null, version: 1, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z', measurements: [] }

const designId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const pieceTypeId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const chestDefinitionId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const waistDefinitionId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const definitions = [
  { id: chestDefinitionId, pieceTypeId, code: 'CHEST', label: 'Chest around', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: true, sortOrder: 0, active: true },
  { id: waistDefinitionId, pieceTypeId, code: 'WAIST', label: 'Waist around', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: false, sortOrder: 1, active: true },
  { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', pieceTypeId, code: 'OLD', label: 'Archived measure', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: false, sortOrder: 2, active: false },
]

function BackButton() {
  const navigate = useNavigate()
  return <button type="button" onClick={() => navigate(-1)}>Back</button>
}

test('debounces URL-driven search, combines filters, and loads the cursor page', async () => {
  const requests: URL[] = []
  server.use(http.get('*/api/designs', () => HttpResponse.json([{ id: designId, designCode: 'YP', name: 'Yellow Purple', costumeType: 'Dhoti', primaryColor: null, secondaryColor: null, description: null, archivedAt: null, createdAt: item.createdAt, updatedAt: item.updatedAt, originalSetCount: 1, pieceRequirements: [], media: [] }])), http.get('*/api/piece-types', () => HttpResponse.json([{ id: pieceTypeId, code: 'BL', name: 'Blouse', description: null, active: true, sortOrder: 1 }])), http.get('*/api/inventory-items', ({ request }) => {
    requests.push(new URL(request.url))
    const cursor = new URL(request.url).searchParams.get('cursor')
    return HttpResponse.json({ items: cursor ? [{ ...item, id: '44444444-4444-4444-8444-444444444444', inventoryCode: 'YP-S04-BL-02' }] : [item], nextCursor: cursor ? null : 'next-page' })
  }), http.get('*/api/piece-types/:pieceTypeId/measurement-definitions', () => HttpResponse.json(definitions)))
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/inventory?lifecycleStatus=ACTIVE']}><InventoryList /></MemoryRouter>)

  await screen.findByText('YP-S04-BL-01')
  await user.selectOptions(screen.getByLabelText(/^design$/i), designId)
  await user.selectOptions(screen.getByLabelText(/piece type/i), pieceTypeId)
  await screen.findByRole('button', { name: /add measurement filter/i })
  await user.click(screen.getByRole('button', { name: /add measurement filter/i }))
  await user.selectOptions(screen.getByLabelText(/measurement definition/i), chestDefinitionId)
  await user.type(screen.getByRole('searchbox', { name: /search inventory/i }), 'YP-S04')
  await user.type(screen.getByLabelText(/storage location/i), 'Rack A')
  await user.type(screen.getByLabelText(/minimum measurement/i), '32')
  await waitFor(() => expect(requests.at(-1)?.searchParams.get('query')).toBe('YP-S04'))
  expect(requests.at(-1)?.searchParams.get('lifecycleStatus')).toBe('ACTIVE')
  expect(requests.at(-1)?.searchParams.get('storageLocation')).toBe('Rack A')
  expect(requests.at(-1)?.searchParams.get('designId')).toBe(designId)
  expect(requests.at(-1)?.searchParams.get('pieceTypeId')).toBe(pieceTypeId)
  expect(requests.at(-1)?.searchParams.getAll('measurement')).toEqual([`${chestDefinitionId}|32|`])
  await user.click(screen.getByRole('button', { name: /load more/i }))
  expect(await screen.findByText('YP-S04-BL-02')).toBeVisible()
  expect(requests.at(-1)?.searchParams.getAll('measurement')).toEqual([`${chestDefinitionId}|32|`])
})

test('adds, removes, serializes, and preserves repeated labelled measurement filters', async () => {
  const requests: URL[] = []
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([{ id: pieceTypeId, code: 'BL', name: 'Blouse', description: null, active: true, sortOrder: 1 }])),
    http.get('*/api/piece-types/:pieceTypeId/measurement-definitions', () => HttpResponse.json(definitions)),
    http.get('*/api/inventory-items', ({ request }) => { requests.push(new URL(request.url)); return HttpResponse.json({ items: [item], nextCursor: null }) }),
  )
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={[`/inventory?pieceTypeId=${pieceTypeId}&measurement=${chestDefinitionId}%7C30%7C36&measurement=${waistDefinitionId}%7C28%7C34`]}><InventoryList /></MemoryRouter>)

  expect(await screen.findByDisplayValue('Chest around')).toBeVisible()
  expect(screen.getByDisplayValue('Waist around')).toBeVisible()
  expect(screen.queryByText('Archived measure')).not.toBeInTheDocument()
  expect(screen.getAllByLabelText(/minimum measurement/i).map((input) => (input as HTMLInputElement).value)).toEqual(['30', '28'])
  await waitFor(() => expect(requests.at(-1)?.searchParams.getAll('measurement')).toEqual([
    `${chestDefinitionId}|30|36`, `${waistDefinitionId}|28|34`,
  ]))
  await user.click(screen.getAllByRole('button', { name: /remove measurement filter/i })[0])
  await waitFor(() => expect(requests.at(-1)?.searchParams.getAll('measurement')).toEqual([`${waistDefinitionId}|28|34`]))
})

test('syncs the search field to browser navigation without a stale debounce overwrite', async () => {
  const requests: URL[] = []
  server.use(http.get('*/api/inventory-items', ({ request }) => { requests.push(new URL(request.url)); return HttpResponse.json({ items: [item], nextCursor: null }) }))
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/inventory?query=first', '/inventory?query=second']} initialIndex={1}><BackButton /><InventoryList /></MemoryRouter>)

  const search = await screen.findByRole('searchbox', { name: /search inventory/i })
  expect(search).toHaveValue('second')
  await user.clear(search)
  await user.type(search, 'stale draft')
  await user.click(screen.getByRole('button', { name: 'Back' }))
  await waitFor(() => expect(search).toHaveValue('first'))
  await new Promise((resolve) => window.setTimeout(resolve, 350))
  expect(search).toHaveValue('first')
  expect(requests.at(-1)?.searchParams.get('query')).toBe('first')
})

test('renders a signed READY thumbnail and rich inventory lineage', async () => {
  const readyMediaId = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
  const richItem = {
    ...item,
    measurements: [{ measurementDefinitionId: chestDefinitionId, code: 'CHEST', label: 'Chest around', value: '34' }],
    pieceType: { id: pieceTypeId, code: 'BL', name: 'Blouse' },
    originalSet: { id: item.originalSetId, originalSetCode: 'YP-S04', designId, sequenceNumber: 4, design: { id: designId, designCode: 'YP', name: 'Yellow Purple', costumeType: 'Dhoti', primaryColor: null, secondaryColor: null } },
    media: [
      { id: 'pending-link', mediaAssetId: 'pending-media', purpose: 'INVENTORY_ITEM', caption: null, sortOrder: 0, mediaAsset: { id: 'pending-media', objectKey: 'pending', mimeType: 'image/jpeg', byteSize: 10, checksum: null, uploadStatus: 'PENDING', uploadedById: item.id, createdAt: item.createdAt, updatedAt: item.updatedAt } },
      { id: 'ready-link', mediaAssetId: readyMediaId, purpose: 'INVENTORY_ITEM', caption: 'Front view', sortOrder: 1, mediaAsset: { id: readyMediaId, objectKey: 'ready', mimeType: 'image/jpeg', byteSize: 10, checksum: null, uploadStatus: 'READY', uploadedById: item.id, createdAt: item.createdAt, updatedAt: item.updatedAt } },
    ],
  }
  server.use(
    http.get('*/api/designs', () => HttpResponse.json([])),
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.get('*/api/inventory-items', () => HttpResponse.json({ items: [richItem], nextCursor: null })),
    http.get(`*/api/media/${readyMediaId}/read`, () => HttpResponse.json({ url: 'https://cdn.example.test/ready.jpg', expiresAt: '2026-08-18T00:00:00.000Z' })),
  )
  render(<MemoryRouter><InventoryList /></MemoryRouter>)

  expect(await screen.findByRole('img', { name: /front view/i })).toHaveAttribute('src', 'https://cdn.example.test/ready.jpg')
  expect(screen.getByText('Yellow Purple · YP-S04 · Blouse')).toBeVisible()
  expect(screen.getByText(/Chest around: 34/)).toBeVisible()
  expect(screen.getByText(/Rack A/)).toBeVisible()
  expect(screen.getByText('Available')).toBeVisible()
})

test('shows an accessible empty state and resets all active filters', async () => {
  server.use(http.get('*/api/inventory-items', () => HttpResponse.json({ items: [], nextCursor: null })))
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/inventory?query=missing&condition=FAIR']}><InventoryList /></MemoryRouter>)
  expect(await screen.findByRole('heading', { name: /no inventory items/i })).toBeVisible()
  await user.click(screen.getByRole('button', { name: /clear filters/i }))
  expect(screen.getByRole('searchbox', { name: /search inventory/i })).toHaveValue('')
})

test('shows the server error state when inventory search fails', async () => {
  server.use(http.get('*/api/inventory-items', () => HttpResponse.json({ message: 'Search is unavailable.' }, { status: 500 })))
  render(<MemoryRouter><InventoryList /></MemoryRouter>)
  expect(await screen.findByText('Search is unavailable.')).toBeVisible()
  expect(screen.queryByRole('heading', { name: /no inventory items/i })).not.toBeInTheDocument()
  expect(screen.queryByText(/loading inventory/i)).not.toBeInTheDocument()
})

test('shows a recoverable measurement-definition error', async () => {
  let attempt = 0
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([{ id: pieceTypeId, code: 'BL', name: 'Blouse', description: null, active: true, sortOrder: 1 }])),
    http.get('*/api/piece-types/:pieceTypeId/measurement-definitions', () => ++attempt === 1 ? HttpResponse.json({ message: 'Measurements unavailable.' }, { status: 500 }) : HttpResponse.json(definitions)),
    http.get('*/api/inventory-items', () => HttpResponse.json({ items: [item], nextCursor: null })),
  )
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={[`/inventory?pieceTypeId=${pieceTypeId}`]}><InventoryList /></MemoryRouter>)
  expect(await screen.findByText('Measurements unavailable.')).toBeVisible()
  await user.click(screen.getByRole('button', { name: /retry measurements/i }))
  expect(await screen.findByRole('button', { name: /add measurement filter/i })).toBeEnabled()
})
