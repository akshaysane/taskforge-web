import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import InventoryList from './InventoryList'
import { server } from '../test/server'

const item = { id: '11111111-1111-4111-8111-111111111111', originalSetId: '22222222-2222-4222-8222-222222222222', pieceTypeId: '33333333-3333-4333-8333-333333333333', pieceSequence: 1, inventoryCode: 'YP-S04-BL-01', lifecycleStatus: 'ACTIVE', condition: 'EXCELLENT', customSize: 'M', storageLocation: 'Rack A', alterationAllowance: null, notes: null, purchaseCost: null, stitchingCost: null, archivedAt: null, version: 1, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z', measurements: [] }

test('debounces URL-driven search, combines filters, and loads the cursor page', async () => {
  const requests: URL[] = []
  const designId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; const pieceTypeId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'; const definitionId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  server.use(http.get('*/api/designs', () => HttpResponse.json([{ id: designId, designCode: 'YP', name: 'Yellow Purple', costumeType: 'Dhoti', primaryColor: null, secondaryColor: null, description: null, archivedAt: null, createdAt: item.createdAt, updatedAt: item.updatedAt, originalSetCount: 1, pieceRequirements: [], media: [] }])), http.get('*/api/piece-types', () => HttpResponse.json([{ id: pieceTypeId, code: 'BL', name: 'Blouse', description: null, active: true, sortOrder: 1 }])), http.get('*/api/inventory-items', ({ request }) => {
    requests.push(new URL(request.url))
    const cursor = new URL(request.url).searchParams.get('cursor')
    return HttpResponse.json({ items: cursor ? [{ ...item, id: '44444444-4444-4444-8444-444444444444', inventoryCode: 'YP-S04-BL-02' }] : [item], nextCursor: cursor ? null : 'next-page' })
  }))
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/inventory?lifecycleStatus=ACTIVE']}><InventoryList /></MemoryRouter>)

  await screen.findByText('YP-S04-BL-01')
  await user.selectOptions(screen.getByLabelText(/^design$/i), designId)
  await user.selectOptions(screen.getByLabelText(/piece type/i), pieceTypeId)
  await user.type(screen.getByRole('searchbox', { name: /search inventory/i }), 'YP-S04')
  await user.type(screen.getByLabelText(/storage location/i), 'Rack A')
  await user.type(screen.getByLabelText(/measurement definition/i), definitionId)
  await user.type(screen.getByLabelText(/minimum measurement/i), '32')
  await waitFor(() => expect(requests.at(-1)?.searchParams.get('query')).toBe('YP-S04'))
  expect(requests.at(-1)?.searchParams.get('lifecycleStatus')).toBe('ACTIVE')
  expect(requests.at(-1)?.searchParams.get('storageLocation')).toBe('Rack A')
  expect(requests.at(-1)?.searchParams.get('designId')).toBe(designId)
  expect(requests.at(-1)?.searchParams.get('pieceTypeId')).toBe(pieceTypeId)
  expect(requests.at(-1)?.searchParams.get('measurement')).toBe(`${definitionId}|32|`)
  await user.click(screen.getByRole('button', { name: /load more/i }))
  expect(await screen.findByText('YP-S04-BL-02')).toBeVisible()
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
})
