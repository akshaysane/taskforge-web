import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { expect, test, vi } from 'vitest'
import Designs from './Designs'
import DesignDetail from './DesignDetail'
import { server } from '../test/server'

const createdDesign = {
  id: '4e48d7f1-fdef-4b21-a2bb-9df4c7492db5',
  designCode: 'YP',
  name: 'Yellow Purple Dhoti',
  costumeType: 'Dhoti',
  primaryColor: 'Yellow',
  secondaryColor: 'Purple',
  description: null,
  archivedAt: null,
  createdAt: '2026-08-17T00:00:00.000Z',
  updatedAt: '2026-08-17T00:00:00.000Z',
  originalSetCount: 2,
  pieceRequirements: [],
}

function renderDesigns() {
  return render(<MemoryRouter><Designs /></MemoryRouter>)
}

test('creates a design and displays the normalized code', async () => {
  server.use(
    http.get('*/api/designs', () => HttpResponse.json([])),
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.post('*/api/designs', () => HttpResponse.json(createdDesign, { status: 201 })),
    http.put('*/api/designs/:designId/piece-requirements', () => HttpResponse.json([])),
  )
  const user = userEvent.setup()
  renderDesigns()

  await user.click(await screen.findByRole('button', { name: /add design/i }))
  await user.type(screen.getByLabelText(/design code/i), 'yp')
  await user.type(screen.getByLabelText(/^name$/i), 'Yellow Purple Dhoti')
  await user.type(screen.getByLabelText(/costume type/i), 'Dhoti')
  await user.click(screen.getByRole('button', { name: /save design/i }))

  expect(await screen.findByText('YP')).toBeVisible()
})

test('renders server field errors in the design form', async () => {
  server.use(
    http.get('*/api/designs', () => HttpResponse.json([])),
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.post('*/api/designs', () => HttpResponse.json({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
      fieldErrors: { designCode: 'must use two to ten letters' },
    }, { status: 400 })),
  )
  const user = userEvent.setup()
  renderDesigns()

  await user.click(await screen.findByRole('button', { name: /add design/i }))
  await user.type(screen.getByLabelText(/design code/i), '1')
  await user.type(screen.getByLabelText(/^name$/i), 'Yellow Purple Dhoti')
  await user.type(screen.getByLabelText(/costume type/i), 'Dhoti')
  await user.click(screen.getByRole('button', { name: /save design/i }))

  expect(await screen.findByText('must use two to ten letters')).toBeVisible()
})

test('adds the three configured piece types as required design pieces', async () => {
  const pieces = [
    { id: '4e48d7f1-fdef-4b21-a2bb-9df4c7492db5', code: 'BL', name: 'Blouse', description: null, active: true, sortOrder: 1 },
    { id: 'da4d0cf9-2d87-446d-ae29-d6e3b7e0650f', code: 'PF', name: 'Pant + Fan', description: null, active: true, sortOrder: 2 },
    { id: '780590f8-a148-4af1-b809-dc1fe5b652ee', code: 'DV', name: 'Dhavani', description: null, active: true, sortOrder: 3 },
  ]
  server.use(http.get('*/api/piece-types', () => HttpResponse.json(pieces)))
  const user = userEvent.setup()
  render(<MemoryRouter><DesignDetail /></MemoryRouter>)

  await screen.findByRole('button', { name: /add piece/i })
  await user.click(screen.getByRole('button', { name: /add piece/i }))
  await user.click(screen.getByRole('button', { name: /add piece/i }))
  await user.click(screen.getByRole('button', { name: /add piece/i }))

  expect(screen.getAllByRole('checkbox', { name: /required/i })).toHaveLength(3)
})

test('archives a design after confirmation and removes it from the active catalog', async () => {
  server.use(
    http.get('*/api/designs', () => HttpResponse.json([createdDesign])),
    http.delete('*/api/designs/:designId', () => new HttpResponse(null, { status: 204 })),
  )
  const user = userEvent.setup()
  renderDesigns()

  await user.click(await screen.findByRole('button', { name: /archive yellow purple dhoti/i }))
  expect(screen.getByRole('dialog', { name: /archive design/i })).toBeVisible()
  await user.click(screen.getByRole('button', { name: /archive design/i }))

  expect(await screen.findByText(/no active designs yet/i)).toBeVisible()
})

test('sends null to clear optional design fields', async () => {
  let patchBody: Record<string, unknown> | undefined
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.get('*/api/designs/:designId', () => HttpResponse.json(createdDesign)),
    http.patch('*/api/designs/:designId', async ({ request }) => {
      patchBody = await request.json() as Record<string, unknown>
      return HttpResponse.json({ ...createdDesign, primaryColor: null, secondaryColor: null, description: null })
    }),
    http.put('*/api/designs/:designId/piece-requirements', () => HttpResponse.json([])),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><DesignDetail designId={createdDesign.id} /></MemoryRouter>)

  await user.clear(await screen.findByLabelText(/primary color/i))
  await user.clear(screen.getByLabelText(/secondary color/i))
  await user.clear(screen.getByLabelText(/description/i))
  await user.click(screen.getByRole('button', { name: /save design/i }))

  expect(patchBody).toMatchObject({ primaryColor: null, secondaryColor: null, description: null })
})

test('edits a design code and sends its loaded code with an unconfirmed update', async () => {
  let patchBody: Record<string, unknown> | undefined
  const editableDesign = { ...createdDesign, originalSetCount: 0 }
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.get('*/api/designs/:designId', () => HttpResponse.json(editableDesign)),
    http.patch('*/api/designs/:designId', async ({ request }) => {
      patchBody = await request.json() as Record<string, unknown>
      return HttpResponse.json({ ...editableDesign, designCode: 'DH-AD02' })
    }),
    http.put('*/api/designs/:designId/piece-requirements', () => HttpResponse.json([])),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><DesignDetail designId={createdDesign.id} /></MemoryRouter>)

  const code = await screen.findByLabelText(/design code/i)
  expect(code).not.toHaveAttribute('readonly')
  await user.clear(code)
  await user.type(code, 'DH-AD02')
  await user.click(screen.getByRole('button', { name: /save design/i }))

  await waitFor(() => expect(patchBody).toMatchObject({
    designCode: 'DH-AD02',
    expectedDesignCode: 'YP',
    confirmCodeChange: false,
  }))
})

test('renders a duplicate design code error without opening confirmation', async () => {
  const editableDesign = { ...createdDesign, originalSetCount: 0 }
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.get('*/api/designs/:designId', () => HttpResponse.json(editableDesign)),
    http.patch('*/api/designs/:designId', () => HttpResponse.json({
      code: 'DESIGN_CODE_DUPLICATE',
      message: 'This Design Code is already in use.',
      fieldErrors: { designCode: 'This Design Code is already in use.' },
    }, { status: 409 })),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><DesignDetail designId={createdDesign.id} /></MemoryRouter>)

  const code = await screen.findByLabelText(/design code/i)
  await user.clear(code)
  await user.type(code, 'DH-AD02')
  await user.click(screen.getByRole('button', { name: /save design/i }))

  expect(await screen.findByText('This Design Code is already in use.', { selector: '#design-code-error' })).toBeVisible()
  expect(screen.queryByRole('dialog', { name: /confirm design code change/i })).not.toBeInTheDocument()
})

test('requires local confirmation before changing a code with dependent original sets', async () => {
  let patchCount = 0
  let patchBody: Record<string, unknown> | undefined
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.get('*/api/designs/:designId', () => HttpResponse.json(createdDesign)),
    http.patch('*/api/designs/:designId', async ({ request }) => {
      patchCount += 1
      patchBody = await request.json() as Record<string, unknown>
      return HttpResponse.json({ ...createdDesign, designCode: 'DH-AD02' })
    }),
    http.put('*/api/designs/:designId/piece-requirements', () => HttpResponse.json([])),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><DesignDetail designId={createdDesign.id} /></MemoryRouter>)

  const code = await screen.findByLabelText(/design code/i)
  await user.clear(code)
  await user.type(code, 'DH-AD02')
  await user.click(screen.getByRole('button', { name: /save design/i }))

  expect(screen.getByRole('dialog', { name: /confirm design code change/i })).toHaveTextContent('Changing this Design Code will also update the generated Original Set and Inventory codes associated with this design. Existing database relationships and rental history will remain unchanged.')
  expect(patchCount).toBe(0)
  await user.click(within(screen.getByRole('dialog', { name: /confirm design code change/i })).getByRole('button', { name: /cancel/i }))
  expect(screen.getByLabelText(/design code/i)).toHaveValue('DH-AD02')
  await user.click(screen.getByRole('button', { name: /save design/i }))
  await user.click(screen.getByRole('button', { name: /change design code/i }))

  await waitFor(() => expect(patchBody).toMatchObject({ confirmCodeChange: true }))
})

test('opens confirmation when the server reports a newly created dependent set', async () => {
  let patchCount = 0
  const editableDesign = { ...createdDesign, originalSetCount: 0 }
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.get('*/api/designs/:designId', () => HttpResponse.json(editableDesign)),
    http.patch('*/api/designs/:designId', () => {
      patchCount += 1
      return patchCount === 1
        ? HttpResponse.json({ code: 'DESIGN_CODE_CHANGE_CONFIRMATION_REQUIRED', message: 'Confirmation required.' }, { status: 409 })
        : HttpResponse.json({ ...editableDesign, designCode: 'DH-AD02', originalSetCount: 1 })
    }),
    http.put('*/api/designs/:designId/piece-requirements', () => HttpResponse.json([])),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><DesignDetail designId={createdDesign.id} /></MemoryRouter>)

  const code = await screen.findByLabelText(/design code/i)
  await user.clear(code)
  await user.type(code, 'DH-AD02')
  await user.click(screen.getByRole('button', { name: /save design/i }))

  expect(await screen.findByRole('dialog', { name: /confirm design code change/i })).toBeVisible()
  await user.click(screen.getByRole('button', { name: /change design code/i }))
  await waitFor(() => expect(patchCount).toBe(2))
})

test('confirmation Escape retains the editor and its draft', async () => {
  const onClose = vi.fn()
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.get('*/api/designs/:designId', () => HttpResponse.json(createdDesign)),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><DesignDetail designId={createdDesign.id} onClose={onClose} /></MemoryRouter>)

  const code = await screen.findByLabelText(/design code/i)
  await user.clear(code)
  await user.type(code, 'DH-AD02')
  await user.click(screen.getByRole('button', { name: /save design/i }))
  await screen.findByRole('dialog', { name: /confirm design code change/i })
  await user.keyboard('{Escape}')

  expect(onClose).not.toHaveBeenCalled()
  expect(screen.getByRole('dialog', { name: /edit design/i })).toBeVisible()
  expect(screen.getByLabelText(/design code/i)).toHaveValue('DH-AD02')
})

test('confirmation focus wraps without entering the underlying editor', async () => {
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.get('*/api/designs/:designId', () => HttpResponse.json(createdDesign)),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><DesignDetail designId={createdDesign.id} /></MemoryRouter>)

  const code = await screen.findByLabelText(/design code/i)
  await user.clear(code)
  await user.type(code, 'DH-AD02')
  await user.click(screen.getByRole('button', { name: /save design/i }))
  const confirmation = await screen.findByRole('dialog', { name: /confirm design code change/i })
  const cancel = within(confirmation).getByRole('button', { name: /cancel/i })
  const confirm = within(confirmation).getByRole('button', { name: /change design code/i })

  expect(cancel).toHaveFocus()
  await user.keyboard('{Shift>}{Tab}{/Shift}')
  expect(confirm).toHaveFocus()
  await user.keyboard('{Tab}')
  expect(cancel).toHaveFocus()
})

test('server-required confirmation submits the original delayed draft snapshot', async () => {
  const patchBodies: Record<string, unknown>[] = []
  const editableDesign = { ...createdDesign, originalSetCount: 0 }
  let respondConfirmation: ((response: Response) => void) | undefined
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.get('*/api/designs/:designId', () => HttpResponse.json(editableDesign)),
    http.patch('*/api/designs/:designId', async ({ request }) => {
      patchBodies.push(await request.json() as Record<string, unknown>)
      if (patchBodies.length === 1) return await new Promise<Response>((resolve) => { respondConfirmation = resolve })
      return HttpResponse.json({ ...editableDesign, designCode: 'DH-AD02', originalSetCount: 1 })
    }),
    http.put('*/api/designs/:designId/piece-requirements', () => HttpResponse.json([])),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><DesignDetail designId={createdDesign.id} /></MemoryRouter>)

  const code = await screen.findByLabelText(/design code/i)
  await user.clear(code)
  await user.type(code, 'DH-AD02')
  await user.click(screen.getByRole('button', { name: /save design/i }))
  await waitFor(() => expect(respondConfirmation).toBeTypeOf('function'))
  await user.clear(code)
  await user.type(code, 'DH-AD03')
  respondConfirmation?.(HttpResponse.json({ code: 'DESIGN_CODE_CHANGE_CONFIRMATION_REQUIRED', message: 'Confirmation required.' }, { status: 409 }))

  const confirmation = await screen.findByRole('dialog', { name: /confirm design code change/i })
  await user.click(within(confirmation).getByRole('button', { name: /change design code/i }))

  await waitFor(() => expect(patchBodies).toHaveLength(2))
  expect(patchBodies[1]).toMatchObject({
    designCode: 'DH-AD02',
    expectedDesignCode: 'YP',
    confirmCodeChange: true,
  })
})

test('keeps a successful code change after requirement saving fails and retries against the new code', async () => {
  const expectedCodes: string[] = []
  const editableDesign = { ...createdDesign, originalSetCount: 0 }
  let requirementAttempt = 0
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.get('*/api/designs/:designId', () => HttpResponse.json(editableDesign)),
    http.patch('*/api/designs/:designId', async ({ request }) => {
      const body = await request.json() as Record<string, unknown>
      expectedCodes.push(body.expectedDesignCode as string)
      return HttpResponse.json({ ...editableDesign, designCode: 'DH-AD02' })
    }),
    http.put('*/api/designs/:designId/piece-requirements', () => {
      requirementAttempt += 1
      return requirementAttempt === 1
        ? HttpResponse.json({ message: 'Requirements could not be saved.' }, { status: 500 })
        : HttpResponse.json([])
    }),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><DesignDetail designId={createdDesign.id} /></MemoryRouter>)

  const code = await screen.findByLabelText(/design code/i)
  await user.clear(code)
  await user.type(code, 'DH-AD02')
  await user.click(screen.getByRole('button', { name: /save design/i }))

  expect(await screen.findByText('Requirements could not be saved.')).toBeVisible()
  expect(screen.getByLabelText(/design code/i)).toHaveValue('DH-AD02')
  await user.click(screen.getByRole('button', { name: /save design/i }))

  expect(expectedCodes).toEqual(['YP', 'DH-AD02'])
})

test('asks the administrator to reload when the design code is stale', async () => {
  const editableDesign = { ...createdDesign, originalSetCount: 0 }
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.get('*/api/designs/:designId', () => HttpResponse.json(editableDesign)),
    http.patch('*/api/designs/:designId', () => HttpResponse.json({
      code: 'DESIGN_CODE_STALE',
      message: 'The Design Code changed since this design was loaded.',
    }, { status: 409 })),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><DesignDetail designId={createdDesign.id} /></MemoryRouter>)

  const code = await screen.findByLabelText(/design code/i)
  await user.clear(code)
  await user.type(code, 'DH-AD02')
  await user.click(screen.getByRole('button', { name: /save design/i }))

  expect(await screen.findByText('This Design Code changed elsewhere. Reload the design before trying again.')).toBeVisible()
  expect(screen.getByLabelText(/design code/i)).toHaveValue('DH-AD02')
})

test('attaches and displays a READY reference photo for an existing design', async () => {
  let attached = false
  const asset = { id: '7de0f4e2-37be-49b9-a311-a5f707a3e2a4', objectKey: 'inventory-media/reference.jpg', mimeType: 'image/jpeg', byteSize: 4, checksum: null, uploadStatus: 'READY', uploadedById: createdDesign.id, createdAt: createdDesign.createdAt, updatedAt: createdDesign.updatedAt }
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json([])),
    http.get('*/api/designs/:designId', () => HttpResponse.json({ ...createdDesign, media: [] })),
    http.post('*/api/media/uploads', () => HttpResponse.json({ mediaAsset: { ...asset, uploadStatus: 'PENDING' }, upload: { url: 'https://uploads.example/reference', method: 'PUT', headers: { 'content-type': 'image/jpeg' }, expiresAt: createdDesign.updatedAt } }, { status: 201 })),
    http.put('https://uploads.example/reference', () => new HttpResponse(null, { status: 200 })),
    http.post('*/api/media/:mediaAssetId/complete', () => HttpResponse.json(asset)),
    http.post('*/api/designs/:designId/media/:mediaAssetId', () => { attached = true; return HttpResponse.json({ id: 'media-link', mediaAssetId: asset.id, purpose: 'REFERENCE', caption: null, sortOrder: 0, mediaAsset: asset }, { status: 201 }) }),
  )
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:reference')
  const user = userEvent.setup()
  render(<MemoryRouter><DesignDetail designId={createdDesign.id} /></MemoryRouter>)

  await user.upload(await screen.findByLabelText(/add photo/i), new File(['test'], 'reference.jpg', { type: 'image/jpeg' }))

  await screen.findByRole('img', { name: 'reference.jpg' })
  expect(attached).toBe(true)
})

test('opens an accessible design sheet and restores focus after Escape', async () => {
  server.use(http.get('*/api/designs', () => HttpResponse.json([])), http.get('*/api/piece-types', () => HttpResponse.json([])))
  const user = userEvent.setup()
  renderDesigns()
  const trigger = await screen.findByRole('button', { name: /add design/i })
  await user.click(trigger)
  expect(screen.getByRole('dialog', { name: /add design/i })).toBeVisible()
  expect(screen.getByRole('button', { name: /close design editor/i })).toHaveFocus()
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog', { name: /add design/i })).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})
