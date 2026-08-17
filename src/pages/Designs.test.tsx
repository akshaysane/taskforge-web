import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
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
