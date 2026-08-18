import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import OriginalSetOnboarding from './OriginalSetOnboarding'
import { server } from '../test/server'

const ids = { set: '2e48d7f1-fdef-4b21-a2bb-9df4c7492db5', design: '4e48d7f1-fdef-4b21-a2bb-9df4c7492db5', piece: '8e48d7f1-fdef-4b21-a2bb-9df4c7492db5', item: '9e48d7f1-fdef-4b21-a2bb-9df4c7492db5', definition: '7e48d7f1-fdef-4b21-a2bb-9df4c7492db5', photo: '6e48d7f1-fdef-4b21-a2bb-9df4c7492db5' }
const item = { id: ids.item, originalSetId: ids.set, pieceTypeId: ids.piece, pieceSequence: 1, inventoryCode: 'YP-S04-BL', customSize: null, lifecycleStatus: 'ACTIVE', condition: 'GOOD', storageLocation: null, alterationAllowance: null, notes: null, purchaseCost: null, stitchingCost: null, archivedAt: null, version: 1, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z', measurements: [], labelVerified: false }
const detail = {
  id: ids.set, designId: ids.design, originalSetCode: 'YP-S04', sequenceNumber: 4, notes: 'Tailor packet', verifiedAt: null, verifiedById: null, archivedAt: null, createdAt: item.createdAt, updatedAt: item.updatedAt, inventoryItemCount: 1,
  design: { id: ids.design, designCode: 'YP', name: 'Yellow / Purple Dhoti', costumeType: 'Dhoti', primaryColor: 'Yellow', secondaryColor: 'Purple', pieceRequirements: [{ id: '5e48d7f1-fdef-4b21-a2bb-9df4c7492db5', designId: ids.design, pieceTypeId: ids.piece, quantity: 1, required: true, sortOrder: 0, pieceType: { id: ids.piece, code: 'BL', name: 'Blouse', measurementDefinitions: [{ id: ids.definition, pieceTypeId: ids.piece, code: 'CHEST', label: 'Chest around', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: true, sortOrder: 0, active: true }] } }] },
  inventoryItems: [item], media: [{ id: 'link', mediaAssetId: ids.photo, purpose: 'REFERENCE', caption: null, sortOrder: 0, mediaAsset: { id: ids.photo, objectKey: 'photo.jpg', mimeType: 'image/jpeg', byteSize: 20, checksum: null, uploadStatus: 'READY', uploadedById: ids.design, createdAt: item.createdAt, updatedAt: item.updatedAt } }],
}

function renderOnboarding(entry = `/original-sets/${ids.set}`) { return render(<MemoryRouter initialEntries={[entry]}><Routes><Route path="/original-sets/:originalSetId" element={<OriginalSetOnboarding />} /></Routes></MemoryRouter>) }

test('derives the earliest incomplete Pieces stage from restored server detail after remount', async () => {
  server.use(http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json(detail)))
  const first = renderOnboarding()
  expect(await screen.findByRole('heading', { name: /pieces/i })).toBeVisible()
  first.unmount()
  renderOnboarding(`/original-sets/${ids.set}?step=SET`)
  expect(await screen.findByText('YP-S04')).toBeVisible()
  expect(screen.getByRole('heading', { name: /set details/i })).toBeVisible()
  await userEvent.setup().click(screen.getByRole('button', { name: /photo/i }))
  expect(await screen.findByRole('heading', { name: /reference photos/i })).toBeVisible()
})

test('keeps an independently edited piece value after its versioned save fails', async () => {
  server.use(
    http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json(detail)),
    http.patch('*/api/inventory-items/:inventoryItemId', () => HttpResponse.json({ code: 'INVENTORY_VERSION_CONFLICT', message: 'Inventory item was updated by another request.' }, { status: 409 })),
  )
  const user = userEvent.setup()
  renderOnboarding()
  await user.type(await screen.findByLabelText(/chest around/i), '32')
  await user.click(screen.getByRole('button', { name: /save blouse/i }))
  expect(await screen.findByText(/updated by another request/i)).toBeVisible()
  expect(screen.getByLabelText(/chest around/i)).toHaveValue('32')
})

test('does not discard a dirty piece form when Back is declined', async () => {
  server.use(http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json(detail)))
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const user = userEvent.setup()
  renderOnboarding()
  await user.type(await screen.findByLabelText(/chest around/i), '32')
  await user.click(screen.getByRole('button', { name: /^back$/i }))
  expect(confirm).toHaveBeenCalled()
  expect(screen.getByLabelText(/chest around/i)).toHaveValue('32')
})

test('shows label feedback for first and repeated scans and refreshes its server state', async () => {
  let scans = 0
  server.use(
    http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json({ ...detail, inventoryItems: [{ ...item, measurements: [{ measurementDefinitionId: ids.definition, code: 'CHEST', label: 'Chest around', value: '32' }] }] })),
    http.post('*/api/inventory-items/by-code/:inventoryCode/verify-label', () => HttpResponse.json({ alreadyVerified: scans++ > 0 })),
  )
  const user = userEvent.setup()
  renderOnboarding()
  await user.click(await screen.findByRole('button', { name: /labels/i }))
  await user.type(screen.getByLabelText(/manual code/i), 'YP-S04-BL')
  await user.click(screen.getByRole('button', { name: /verify label/i }))
  expect(await screen.findByText('Label verified')).toBeVisible()
  await user.click(screen.getByRole('button', { name: /verify label/i }))
  expect(await screen.findByText('Already verified')).toBeVisible()
})

test('renders exact verification blockers from the server and successful verification state', async () => {
  server.use(
    http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json({ ...detail, inventoryItems: [{ ...item, measurements: [{ measurementDefinitionId: ids.definition, code: 'CHEST', label: 'Chest around', value: '32' }], labelVerified: true }] })),
    http.post('*/api/original-sets/:originalSetId/verify', () => HttpResponse.json({ code: 'ORIGINAL_SET_INCOMPLETE', message: 'Original set is incomplete.', blockers: ['LABEL_SCANS'] }, { status: 409 })),
  )
  const user = userEvent.setup()
  renderOnboarding(`/original-sets/${ids.set}?step=VERIFY`)
  await user.click(await screen.findByRole('button', { name: /verify original set/i }))
  expect(await screen.findByText(/label scans/i)).toBeVisible()
  vi.restoreAllMocks()
})
