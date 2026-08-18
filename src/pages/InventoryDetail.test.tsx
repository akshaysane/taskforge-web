import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, test } from 'vitest'
import InventoryDetail from './InventoryDetail'
import { server } from '../test/server'

const item = { id: '11111111-1111-4111-8111-111111111111', originalSetId: '22222222-2222-4222-8222-222222222222', pieceTypeId: '33333333-3333-4333-8333-333333333333', pieceSequence: 1, inventoryCode: 'YP-S04-BL-01', lifecycleStatus: 'ACTIVE', condition: 'EXCELLENT', customSize: 'M', storageLocation: 'Rack A', alterationAllowance: null, notes: null, purchaseCost: null, stitchingCost: null, archivedAt: null, version: 2, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z', measurements: [{ measurementDefinitionId: '44444444-4444-4444-8444-444444444444', code: 'BUST', label: 'Bust', value: '34' }] }

function renderDetail() { return render(<MemoryRouter initialEntries={['/inventory/YP-S04-BL-01']}><Routes><Route path="/inventory/:inventoryCode" element={<InventoryDetail />} /></Routes></MemoryRouter>) }
function DetailRoutes() { return <><Link to="/inventory/YP-S04-BL-02">Second item</Link><Routes><Route path="/inventory/:inventoryCode" element={<InventoryDetail />} /></Routes></> }

test('shows immutable identity, measurements, history, QR label and saves a mutable update', async () => {
  let updateBody: Record<string, unknown> | undefined
  server.use(
    http.get('*/api/inventory-items/by-code/:code', () => HttpResponse.json(item)),
    http.get('*/api/inventory-items/:id', () => HttpResponse.json(item)),
    http.get('*/api/inventory-items/:id/events', () => HttpResponse.json([{ id: 'event', inventoryItemId: item.id, eventType: 'CREATED', actorUserId: 'admin', rentalId: null, metadata: {}, occurredAt: item.createdAt }])),
    http.patch('*/api/inventory-items/:id', async ({ request }) => { updateBody = await request.json() as Record<string, unknown>; return HttpResponse.json({ ...item, notes: 'Hem checked', version: 3 }) }),
  )
  const user = userEvent.setup()
  renderDetail()
  expect(await screen.findByRole('heading', { name: 'YP-S04-BL-01' })).toBeVisible()
  expect(screen.getByText(/bust/i)).toBeVisible()
  expect(screen.getByText(/created/i)).toBeVisible()
  expect(screen.getByText(/identity is permanent/i)).toBeVisible()
  await user.type(screen.getByLabelText(/notes/i), 'Hem checked')
  await user.click(screen.getByRole('button', { name: /save overview/i }))
  expect(updateBody).toMatchObject({ version: 2, notes: 'Hem checked' })
})

test('requires a lifecycle note for missing and sends confirmed transition', async () => {
  let transitionBody: Record<string, unknown> | undefined
  server.use(
    http.get('*/api/inventory-items/by-code/:code', () => HttpResponse.json(item)),
    http.get('*/api/inventory-items/:id', () => HttpResponse.json(item)), http.get('*/api/inventory-items/:id/events', () => HttpResponse.json([])),
    http.post('*/api/inventory-items/:id/lifecycle-transitions', async ({ request }) => { transitionBody = await request.json() as Record<string, unknown>; return HttpResponse.json({ ...item, lifecycleStatus: 'MISSING', version: 3 }) }),
  )
  const user = userEvent.setup(); renderDetail()
  await screen.findByRole('heading', { name: 'YP-S04-BL-01' })
  await user.selectOptions(screen.getByLabelText(/change lifecycle/i), 'MISSING')
  await user.click(screen.getByRole('button', { name: /change lifecycle/i }))
  expect(screen.getByText(/note is required/i)).toBeVisible()
  await user.type(screen.getByLabelText(/transition note/i), 'Not in rack')
  await user.click(screen.getByRole('button', { name: /confirm lifecycle/i }))
  expect(transitionBody).toMatchObject({ to: 'MISSING', notes: 'Not in rack', expectedVersion: 2 })
})

test('keeps the dirty draft after an optimistic version conflict refresh', async () => {
  let detailReads = 0
  server.use(
    http.get('*/api/inventory-items/by-code/:code', () => HttpResponse.json(item)),
    http.get('*/api/inventory-items/:id', () => HttpResponse.json({ ...item, version: ++detailReads === 1 ? 2 : 3, notes: detailReads === 1 ? null : 'Someone else saved' })),
    http.get('*/api/inventory-items/:id/events', () => HttpResponse.json([])),
    http.patch('*/api/inventory-items/:id', () => HttpResponse.json({ code: 'INVENTORY_VERSION_CONFLICT', message: 'Changed.' }, { status: 409 })),
  )
  const user = userEvent.setup(); renderDetail()
  await screen.findByRole('heading', { name: 'YP-S04-BL-01' })
  await user.type(screen.getByLabelText(/notes/i), 'My unsaved note')
  await user.click(screen.getByRole('button', { name: /save overview/i }))
  expect(await screen.findByText(/latest record was loaded/i)).toBeVisible()
  expect(screen.getByLabelText(/notes/i)).toHaveValue('My unsaved note')
})

test('loads existing item photo links returned by the detail API', async () => {
  const media = { id: 'media-link', mediaAssetId: '55555555-5555-4555-8555-555555555555', purpose: 'INVENTORY_ITEM', caption: 'Front view', sortOrder: 0, mediaAsset: { id: '55555555-5555-4555-8555-555555555555', objectKey: 'items/front.jpg', mimeType: 'image/jpeg', byteSize: 1, checksum: null, uploadStatus: 'READY', uploadedById: 'admin', createdAt: item.createdAt, updatedAt: item.updatedAt } }
  server.use(http.get('*/api/inventory-items/by-code/:code', () => HttpResponse.json(item)), http.get('*/api/inventory-items/:id', () => HttpResponse.json({ ...item, media: [media] })), http.get('*/api/inventory-items/:id/events', () => HttpResponse.json([])), http.get('*/api/media/:id/read', () => HttpResponse.json({ url: 'https://media.example/front.jpg', expiresAt: item.updatedAt })))
  const user = userEvent.setup(); renderDetail()
  await screen.findByRole('button', { name: 'Load photo' })
  await user.click(screen.getByRole('button', { name: 'Load photo' }))
  expect(await screen.findByRole('img', { name: 'Front view' })).toBeVisible()
})

test('merges a base PATCH response into the rich detail and refreshes history', async () => {
  let eventReads = 0
  const rich = { ...item, pieceType: { id: item.pieceTypeId, code: 'BL', name: 'Blouse' }, originalSet: { id: item.originalSetId, originalSetCode: 'YP-S04', designId: 'design', sequenceNumber: 4, design: { id: 'design', designCode: 'YP', name: 'Yellow Purple', costumeType: 'Dhoti', primaryColor: null, secondaryColor: null } }, media: [] }
  server.use(http.get('*/api/inventory-items/by-code/:code', () => HttpResponse.json(item)), http.get('*/api/inventory-items/:id', () => HttpResponse.json(rich)), http.get('*/api/inventory-items/:id/events', () => HttpResponse.json(eventReads++ ? [{ id: 'updated', inventoryItemId: item.id, eventType: 'MEASUREMENTS_UPDATED', actorUserId: 'admin', rentalId: null, metadata: { note: 'fresh' }, occurredAt: item.updatedAt }] : [])), http.patch('*/api/inventory-items/:id', () => HttpResponse.json({ ...item, version: 3, notes: 'Saved' })))
  const user = userEvent.setup(); renderDetail()
  await screen.findByText('Yellow Purple')
  await user.type(screen.getByLabelText(/notes/i), 'Saved')
  await user.click(screen.getByRole('button', { name: /save overview/i }))
  expect(await screen.findByText('MEASUREMENTS UPDATED')).toBeVisible()
  expect(screen.getByText('Yellow Purple')).toBeVisible()
  expect(screen.getByText('Blouse')).toBeVisible()
})

test.each([[404, 'Inventory item not found.'], [500, 'Inventory service unavailable.']])('renders terminal detail %i errors rather than a permanent loading state', async (status, message) => {
  server.use(http.get('*/api/inventory-items/by-code/:code', () => HttpResponse.json({ message }, { status })))
  renderDetail()
  expect(await screen.findByText(message)).toBeVisible()
  expect(screen.queryByText(/loading inventory item/i)).not.toBeInTheDocument()
})

test('limits transitions to backend-valid targets and has no retired targets', async () => {
  server.use(http.get('*/api/inventory-items/by-code/:code', () => HttpResponse.json(item)), http.get('*/api/inventory-items/:id', () => HttpResponse.json({ ...item, lifecycleStatus: 'RETIRED' })), http.get('*/api/inventory-items/:id/events', () => HttpResponse.json([])))
  renderDetail()
  await screen.findByRole('heading', { name: item.inventoryCode })
  expect(screen.getByLabelText(/change lifecycle/i)).toBeDisabled()
})

test('resets a dirty draft when the inventory code route changes', async () => {
  const second = { ...item, id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', inventoryCode: 'YP-S04-BL-02', notes: 'Second item note' }
  server.use(
    http.get('*/api/inventory-items/by-code/:code', ({ params }) => HttpResponse.json(params.code === second.inventoryCode ? second : item)),
    http.get('*/api/inventory-items/:id', ({ params }) => HttpResponse.json(params.id === second.id ? second : item)),
    http.get('*/api/inventory-items/:id/events', () => HttpResponse.json([])),
  )
  const user = userEvent.setup()
  render(<MemoryRouter initialEntries={['/inventory/YP-S04-BL-01']}><DetailRoutes /></MemoryRouter>)
  await screen.findByRole('heading', { name: item.inventoryCode })
  await user.type(screen.getByLabelText(/notes/i), 'Unsaved first item draft')
  await user.click(screen.getByRole('link', { name: /second item/i }))
  expect(await screen.findByRole('heading', { name: second.inventoryCode })).toBeVisible()
  expect(screen.getByLabelText(/notes/i)).toHaveValue('Second item note')
})

test('keeps lifecycle intent and note in its modal after a version conflict', async () => {
  let reads = 0
  server.use(
    http.get('*/api/inventory-items/by-code/:code', () => HttpResponse.json(item)),
    http.get('*/api/inventory-items/:id', () => HttpResponse.json({ ...item, version: ++reads === 1 ? 2 : 3 })),
    http.get('*/api/inventory-items/:id/events', () => HttpResponse.json([])),
    http.post('*/api/inventory-items/:id/lifecycle-transitions', () => HttpResponse.json({ code: 'INVENTORY_VERSION_CONFLICT', message: 'Changed.' }, { status: 409 })),
  )
  const user = userEvent.setup()
  renderDetail()
  await screen.findByRole('heading', { name: item.inventoryCode })
  await user.selectOptions(screen.getByLabelText(/change lifecycle/i), 'MISSING')
  await user.click(screen.getByRole('button', { name: /change lifecycle/i }))
  await user.type(screen.getByLabelText(/transition note/i), 'Not in rack')
  await user.click(screen.getByRole('button', { name: /confirm lifecycle/i }))
  expect(await screen.findByText(/review the latest record, then retry/i)).toBeVisible()
  expect(screen.getByLabelText(/transition note/i)).toHaveValue('Not in rack')
  expect(screen.getByText(/change this item to missing/i)).toBeVisible()
})

test('merges a base lifecycle response and refreshes the lifecycle note in history', async () => {
  let eventReads = 0
  const rich = { ...item, pieceType: { id: item.pieceTypeId, code: 'BL', name: 'Blouse' }, originalSet: { id: item.originalSetId, originalSetCode: 'YP-S04', designId: 'design', sequenceNumber: 4, design: { id: 'design', designCode: 'YP', name: 'Yellow Purple', costumeType: 'Dhoti', primaryColor: null, secondaryColor: null } }, media: [] }
  server.use(
    http.get('*/api/inventory-items/by-code/:code', () => HttpResponse.json(item)),
    http.get('*/api/inventory-items/:id', () => HttpResponse.json(rich)),
    http.get('*/api/inventory-items/:id/events', () => HttpResponse.json(eventReads++ ? [{ id: 'lifecycle', inventoryItemId: item.id, eventType: 'LIFECYCLE_CHANGED', actorUserId: 'admin', rentalId: null, metadata: { notes: 'Sent to repair' }, occurredAt: item.updatedAt }] : [])),
    http.post('*/api/inventory-items/:id/lifecycle-transitions', () => HttpResponse.json({ ...item, lifecycleStatus: 'REPAIR_REQUIRED', version: 3 })),
  )
  const user = userEvent.setup()
  renderDetail()
  await screen.findByText('Yellow Purple')
  await user.selectOptions(screen.getByLabelText(/change lifecycle/i), 'REPAIR_REQUIRED')
  await user.click(screen.getByRole('button', { name: /change lifecycle/i }))
  await user.click(screen.getByRole('button', { name: /confirm lifecycle/i }))
  expect(await screen.findByText('LIFECYCLE CHANGED')).toBeVisible()
  expect(screen.getByText(/notes: sent to repair/i)).toBeVisible()
  expect(screen.getByText('Yellow Purple')).toBeVisible()
  expect(screen.getByText('Blouse')).toBeVisible()
})
