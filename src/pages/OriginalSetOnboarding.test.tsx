import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, Link, Outlet, RouterProvider } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import OriginalSetOnboarding from './OriginalSetOnboarding'
import { server } from '../test/server'

const ids = { set: '2e48d7f1-fdef-4b21-a2bb-9df4c7492db5', design: '4e48d7f1-fdef-4b21-a2bb-9df4c7492db5', piece: '8e48d7f1-fdef-4b21-a2bb-9df4c7492db5', item: '9e48d7f1-fdef-4b21-a2bb-9df4c7492db5', definition: '7e48d7f1-fdef-4b21-a2bb-9df4c7492db5', photo: '6e48d7f1-fdef-4b21-a2bb-9df4c7492db5' }
const item = { id: ids.item, originalSetId: ids.set, pieceTypeId: ids.piece, pieceSequence: 1, inventoryCode: 'YP-S04-BL', customSize: null, lifecycleStatus: 'ACTIVE', condition: 'GOOD', storageLocation: null, alterationAllowance: null, notes: null, purchaseCost: null, stitchingCost: null, archivedAt: null, version: 1, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z', measurements: [], labelVerified: false, pieceType: { id: ids.piece, code: 'BL', name: 'Blouse', measurementDefinitions: [{ id: ids.definition, pieceTypeId: ids.piece, code: 'CHEST', label: 'Chest around', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: true, sortOrder: 0, active: true }] } }
const detail = {
  id: ids.set, designId: ids.design, originalSetCode: 'YP-S04', sequenceNumber: 4, notes: 'Tailor packet', verifiedAt: null, verifiedById: null, archivedAt: null, createdAt: item.createdAt, updatedAt: item.updatedAt, inventoryItemCount: 1,
  design: { id: ids.design, designCode: 'YP', name: 'Yellow / Purple Dhoti', costumeType: 'Dhoti', primaryColor: 'Yellow', secondaryColor: 'Purple', pieceRequirements: [{ id: '5e48d7f1-fdef-4b21-a2bb-9df4c7492db5', designId: ids.design, pieceTypeId: ids.piece, quantity: 1, required: true, sortOrder: 0, pieceType: { id: ids.piece, code: 'BL', name: 'Blouse', measurementDefinitions: [{ id: ids.definition, pieceTypeId: ids.piece, code: 'CHEST', label: 'Chest around', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: true, sortOrder: 0, active: true }] } }] },
  inventoryItems: [item], media: [{ id: 'link', mediaAssetId: ids.photo, purpose: 'REFERENCE', caption: null, sortOrder: 0, mediaAsset: { id: ids.photo, objectKey: 'photo.jpg', mimeType: 'image/jpeg', byteSize: 20, checksum: null, uploadStatus: 'READY', uploadedById: ids.design, createdAt: item.createdAt, updatedAt: item.updatedAt } }],
}

function TestLayout({ withDashboardLink }: { withDashboardLink: boolean }) { return <>{withDashboardLink ? <Link to="/dashboard">Dashboard link</Link> : null}<Outlet /></> }
function renderOnboarding(entry: string | string[] = `/original-sets/${ids.set}`, withDashboardLink = false, initialIndex?: number) {
  const router = createMemoryRouter([{ element: <TestLayout withDashboardLink={withDashboardLink} />, children: [{ path: '/original-sets', element: <p>Original sets route</p> }, { path: '/original-sets/:originalSetId', element: <OriginalSetOnboarding /> }, { path: '/dashboard', element: <p>Dashboard route</p> }] }], { initialEntries: Array.isArray(entry) ? entry : [entry], initialIndex })
  return { ...render(<RouterProvider router={router} />), router }
}

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
  expect(await screen.findByText(/latest version was loaded/i)).toBeVisible()
  expect(screen.getByLabelText(/chest around/i)).toHaveValue('32')
})

test('refreshes the version after a conflict so the preserved draft can be retried', async () => {
  let latest = detail
  const submittedVersions: number[] = []
  server.use(
    http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json(latest)),
    http.patch('*/api/inventory-items/:inventoryItemId', async ({ request }) => {
      submittedVersions.push((await request.json() as { version: number }).version)
      if (submittedVersions.length === 1) { latest = { ...detail, inventoryItems: [{ ...item, version: 2 }] }; return HttpResponse.json({ code: 'INVENTORY_VERSION_CONFLICT', message: 'Inventory item was updated by another request.' }, { status: 409 }) }
      return HttpResponse.json({ ...item, version: 3 })
    }),
  )
  const user = userEvent.setup()
  renderOnboarding()
  await user.type(await screen.findByLabelText(/chest around/i), '32')
  await user.click(screen.getByRole('button', { name: /save blouse/i }))
  expect(await screen.findByText(/latest version was loaded/i)).toBeVisible()
  expect(screen.getByLabelText(/chest around/i)).toHaveValue('32')
  await user.click(screen.getByRole('button', { name: /save blouse/i }))
  expect(submittedVersions).toEqual([1, 2])
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
  vi.restoreAllMocks()
})

test('leaves dirty onboarding after one accepted Back confirmation', async () => {
  server.use(http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json(detail)))
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
  const user = userEvent.setup()
  const { router } = renderOnboarding()
  await user.type(await screen.findByLabelText(/chest around/i), '32')
  await user.click(screen.getByRole('button', { name: /^back$/i }))
  expect(await screen.findByText('Original sets route')).toBeVisible()
  expect(router.state.location.pathname).toBe('/original-sets')
  expect(confirm).toHaveBeenCalledTimes(1)
  vi.restoreAllMocks()
})

test('prevents browser unload while a piece draft is dirty', async () => {
  server.use(http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json(detail)))
  const user = userEvent.setup()
  renderOnboarding()
  await user.type(await screen.findByLabelText(/chest around/i), '32')
  await new Promise((resolve) => setTimeout(resolve, 0))
  const event = new Event('beforeunload', { cancelable: true })
  expect(window.dispatchEvent(event)).toBe(false)
  expect(event.defaultPrevented).toBe(true)
})

test('prevents same-origin router navigation when a dirty piece exit is declined', async () => {
  server.use(http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json(detail)))
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const user = userEvent.setup()
  renderOnboarding(`/original-sets/${ids.set}`, true)
  await user.type(await screen.findByLabelText(/chest around/i), '32')
  await user.click(screen.getByRole('link', { name: /dashboard link/i }))
  expect(confirm).toHaveBeenCalled()
  expect(screen.queryByText('Dashboard route')).not.toBeInTheDocument()
  vi.restoreAllMocks()
})

test('keeps dirty onboarding in place when Back or Forward is declined', async () => {
  server.use(http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json(detail)))
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
  const user = userEvent.setup()
  const { router } = renderOnboarding(['/dashboard', `/original-sets/${ids.set}`, '/dashboard'], false, 1)
  await user.type(await screen.findByLabelText(/chest around/i), '32')
  await new Promise((resolve) => setTimeout(resolve, 0))
  await act(async () => { await router.navigate(-1) })
  expect(router.state.location.pathname).toBe(`/original-sets/${ids.set}`)
  await act(async () => { await router.navigate(1) })
  expect(router.state.location.pathname).toBe(`/original-sets/${ids.set}`)
  expect(confirm).toHaveBeenCalledTimes(2)
  vi.restoreAllMocks()
})

test('allows accepted programmatic router navigation from dirty onboarding', async () => {
  server.use(http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json(detail)))
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const user = userEvent.setup()
  const { router } = renderOnboarding()
  await user.type(await screen.findByLabelText(/chest around/i), '32')
  await router.navigate('/dashboard')
  expect(await screen.findByText('Dashboard route')).toBeVisible()
  vi.restoreAllMocks()
})

test('shows label feedback for first and repeated scans and refreshes its server state', async () => {
  let scans = 0
  server.use(
    http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json({ ...detail, inventoryItems: [{ ...item, measurements: [{ measurementDefinitionId: ids.definition, code: 'CHEST', label: 'Chest around', value: '32' }] }] })),
    http.get('*/api/inventory-items/by-code/:inventoryCode', () => HttpResponse.json({ ...item, measurements: [{ measurementDefinitionId: ids.definition, code: 'CHEST', label: 'Chest around', value: '32' }] })),
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

test('verifies a generated UUID label through the immutable item endpoint', async () => {
  let directReads = 0
  let idVerifications = 0
  server.use(
    http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json({ ...detail, inventoryItems: [{ ...item, measurements: [{ measurementDefinitionId: ids.definition, code: 'CHEST', label: 'Chest around', value: '32' }] }] })),
    http.get(`*/api/inventory-items/${ids.item}`, () => {
      directReads += 1
      return HttpResponse.json({ ...item, measurements: [{ measurementDefinitionId: ids.definition, code: 'CHEST', label: 'Chest around', value: '32' }] })
    }),
    http.post(`*/api/inventory-items/${ids.item}/verify-label`, () => {
      idVerifications += 1
      return HttpResponse.json({ alreadyVerified: false })
    }),
  )
  const user = userEvent.setup()
  renderOnboarding()
  await user.click(await screen.findByRole('button', { name: /labels/i }))
  await user.type(screen.getByLabelText(/manual code/i), `${window.location.origin}/inventory/items/${ids.item}`)
  await user.click(screen.getByRole('button', { name: /verify label/i }))

  expect(await screen.findByText('Label verified')).toBeVisible()
  expect(directReads).toBe(1)
  expect(idVerifications).toBe(1)
})

test('keeps an identity-mismatched set at Pieces and regenerates the missing expected item', async () => {
  const wrongItem = { ...item, pieceSequence: 2, inventoryCode: 'YP-S04-BL-02' }
  server.use(
    http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json({ ...detail, inventoryItems: [wrongItem] })),
    http.post('*/api/original-sets/:originalSetId/generate-items', () => HttpResponse.json({ created: 1, existing: 0 })),
  )
  const user = userEvent.setup()
  renderOnboarding()
  expect(await screen.findByText('0 of 1 active pieces complete')).toBeVisible()
  expect(screen.getByText(/YP-S04-BL-02.*Added item/i)).toBeVisible()
  await user.click(screen.getByRole('button', { name: /generate expected pieces/i }))
  expect(await screen.findByRole('button', { name: /generate expected pieces/i })).toBeVisible()
})

test('renders and saves required measurements for a manual piece outside design requirements', async () => {
  const manualPieceId = '1e48d7f1-fdef-4b21-a2bb-9df4c7492d01'
  const armDefinitionId = '1e48d7f1-fdef-4b21-a2bb-9df4c7492d02'
  const manual = { ...item, id: '1e48d7f1-fdef-4b21-a2bb-9df4c7492d03', pieceTypeId: manualPieceId, pieceSequence: 1, inventoryCode: 'YP-S04-MN', pieceType: { id: manualPieceId, code: 'MN', name: 'Manual sleeve', measurementDefinitions: [{ id: armDefinitionId, pieceTypeId: manualPieceId, code: 'ARM', label: 'Arm around', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: true, sortOrder: 0, active: true }] } }
  let saved: unknown
  server.use(
    http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json({ ...detail, inventoryItems: [item, manual] })),
    http.patch('*/api/inventory-items/:inventoryItemId', async ({ request }) => { saved = await request.json(); return HttpResponse.json(manual) }),
  )
  const user = userEvent.setup()
  renderOnboarding()
  expect(await screen.findByText(/YP-S04-MN.*Added item/i)).toBeVisible()
  await user.click(screen.getByRole('button', { name: /edit manual sleeve/i }))
  await user.type(await screen.findByLabelText(/arm around/i), '12')
  await user.click(screen.getByRole('button', { name: /save manual sleeve/i }))
  expect(saved).toMatchObject({ measurements: [{ measurementDefinitionId: armDefinitionId, value: '12' }] })
})

test('keeps only one required-piece editor active at a time', async () => {
  const secondPieceId = '1e48d7f1-fdef-4b21-a2bb-9df4c7492db7'
  const secondDefinitionId = '1e48d7f1-fdef-4b21-a2bb-9df4c7492db8'
  const second = { ...item, id: '1e48d7f1-fdef-4b21-a2bb-9df4c7492db9', pieceTypeId: secondPieceId, pieceSequence: 1, inventoryCode: 'YP-S04-PF', pieceType: { id: secondPieceId, code: 'PF', name: 'Pleated fan', measurementDefinitions: [{ id: secondDefinitionId, pieceTypeId: secondPieceId, code: 'WAIST', label: 'Waist around', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: true, sortOrder: 0, active: true }] } }
  const multiPieceDetail = {
    ...detail,
    design: { ...detail.design, pieceRequirements: [...detail.design.pieceRequirements, { id: '1e48d7f1-fdef-4b21-a2bb-9df4c7492dba', designId: ids.design, pieceTypeId: secondPieceId, quantity: 1, required: true, sortOrder: 1, pieceType: { id: secondPieceId, code: 'PF', name: 'Pleated fan', measurementDefinitions: [{ id: secondDefinitionId, pieceTypeId: secondPieceId, code: 'WAIST', label: 'Waist around', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: true, sortOrder: 0, active: true }] } }] },
    inventoryItems: [item, second],
  }
  server.use(http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json(multiPieceDetail)))
  const user = userEvent.setup()
  renderOnboarding()
  expect(await screen.findByLabelText(/chest around/i)).toBeVisible()
  expect(screen.queryByLabelText(/waist around/i)).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /edit pleated fan/i }))
  expect(await screen.findByLabelText(/waist around/i)).toBeVisible()
  expect(screen.queryByLabelText(/chest around/i)).not.toBeInTheDocument()
})

test('rejects a scanned label that belongs to a different original set before verification', async () => {
  const foreign = { ...item, originalSetId: '1e48d7f1-fdef-4b21-a2bb-9df4c7492db5', measurements: [{ measurementDefinitionId: ids.definition, code: 'CHEST', label: 'Chest around', value: '32' }] }
  let verified = false
  server.use(
    http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json({ ...detail, inventoryItems: [{ ...item, measurements: foreign.measurements }] })),
    http.get('*/api/inventory-items/by-code/:inventoryCode', () => HttpResponse.json(foreign)),
    http.post('*/api/inventory-items/by-code/:inventoryCode/verify-label', () => { verified = true; return HttpResponse.json({ alreadyVerified: false }) }),
  )
  const user = userEvent.setup()
  renderOnboarding()
  await user.type(await screen.findByLabelText(/manual code/i), 'YP-S04-BL')
  await user.click(screen.getByRole('button', { name: /verify label/i }))
  expect(await screen.findByText(/belongs to another original set/i)).toBeVisible()
  expect(verified).toBe(false)
})

test('records every label before printing a full sheet', async () => {
  const measured = { ...item, measurements: [{ measurementDefinitionId: ids.definition, code: 'CHEST', label: 'Chest around', value: '32' }] }
  const ready = { ...detail, inventoryItems: [measured, { ...measured, id: '1e48d7f1-fdef-4b21-a2bb-9df4c7492db5', pieceSequence: 2, inventoryCode: 'YP-S04-BL-02' }] }
  let audited = 0
  const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
  server.use(
    http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json(ready)),
    http.post('*/api/inventory-items/:inventoryItemId/label-printed', () => { audited += 1; return new HttpResponse(null, { status: 204 }) }),
  )
  const user = userEvent.setup()
  renderOnboarding()
  await user.click(await screen.findByRole('button', { name: /print full sheet/i }))
  expect(audited).toBe(2)
  expect(print).toHaveBeenCalled()
})

test('does not open the print dialog when label-print audit recording fails', async () => {
  const ready = { ...detail, inventoryItems: [{ ...item, measurements: [{ measurementDefinitionId: ids.definition, code: 'CHEST', label: 'Chest around', value: '32' }] }] }
  const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
  print.mockClear()
  server.use(
    http.get('*/api/original-sets/:originalSetId', () => HttpResponse.json(ready)),
    http.post('*/api/inventory-items/:inventoryItemId/label-printed', () => HttpResponse.json({ message: 'Audit unavailable.' }, { status: 500 })),
  )
  const user = userEvent.setup()
  renderOnboarding()
  await user.click(await screen.findByRole('button', { name: /print full sheet/i }))
  expect(await screen.findByText(/unable to record label printing/i)).toBeVisible()
  expect(print).not.toHaveBeenCalled()
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
