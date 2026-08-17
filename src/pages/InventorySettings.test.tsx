import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import InventorySettings from './InventorySettings'
import { server } from '../test/server'

const pieceTypes = [
  { id: '4e48d7f1-fdef-4b21-a2bb-9df4c7492db5', code: 'BL', name: 'Blouse', description: null, active: true, sortOrder: 1 },
  { id: 'da4d0cf9-2d87-446d-ae29-d6e3b7e0650f', code: 'PF', name: 'Pant + Fan', description: null, active: true, sortOrder: 2 },
  { id: '780590f8-a148-4af1-b809-dc1fe5b652ee', code: 'DV', name: 'Dhavani', description: null, active: true, sortOrder: 3 },
]

function configureApi() {
  server.use(
    http.get('*/api/piece-types', () => HttpResponse.json(pieceTypes)),
    http.get('*/api/piece-types/:pieceTypeId/measurement-definitions', () => HttpResponse.json([])),
  )
}

test('opens a new required measurement definition', async () => {
  configureApi()
  const user = userEvent.setup()
  render(<InventorySettings />)

  await screen.findByText('Blouse')
  await user.click(screen.getByRole('button', { name: /add measurement/i }))
  expect(screen.getAllByRole('checkbox', { name: /required/i })).toHaveLength(1)
})

test('asks before replacing an unsaved measurement definition', async () => {
  configureApi()
  const user = userEvent.setup()
  render(<InventorySettings />)

  await screen.findByText('Blouse')
  await user.click(screen.getByRole('button', { name: /add measurement/i }))
  await user.type(screen.getByLabelText(/measurement code/i), 'CHEST')
  await user.click(screen.getByRole('button', { name: /Pant \+ Fan/i }))

  expect(screen.getByRole('dialog', { name: /discard unsaved measurement/i })).toBeVisible()
})

test('edits a piece type active state and display order', async () => {
  let patchBody: Record<string, unknown> | undefined
  configureApi()
  server.use(http.patch('*/api/piece-types/:pieceTypeId', async ({ request }) => {
    patchBody = await request.json() as Record<string, unknown>
    return HttpResponse.json({ ...pieceTypes[0], active: false, sortOrder: 4 })
  }))
  const user = userEvent.setup()
  render(<InventorySettings />)

  await user.click(await screen.findByRole('button', { name: /edit piece type/i }))
  await user.clear(screen.getByLabelText(/display order/i))
  await user.type(screen.getByLabelText(/display order/i), '4')
  await user.click(screen.getByRole('checkbox', { name: /^active$/i }))
  await user.click(screen.getByRole('button', { name: /save piece type/i }))

  expect(patchBody).toMatchObject({ active: false, sortOrder: 4 })
})

test('omits a blank matching group when creating a measurement', async () => {
  let requestBody: Record<string, unknown> | undefined
  configureApi()
  server.use(http.post('*/api/piece-types/:pieceTypeId/measurement-definitions', async ({ request, params }) => {
    requestBody = await request.json() as Record<string, unknown>
    return HttpResponse.json({ id: '5a829591-33dd-4dbd-998c-0e3bfb7c0ca4', pieceTypeId: params.pieceTypeId, code: 'CHEST', label: 'Chest', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: true, sortOrder: 0, active: true }, { status: 201 })
  }))
  const user = userEvent.setup()
  render(<InventorySettings />)

  await user.click(await screen.findByRole('button', { name: /add measurement/i }))
  await user.type(screen.getByLabelText(/measurement code/i), 'CHEST')
  await user.type(screen.getByLabelText(/^label$/i), 'Chest')
  await user.click(screen.getByRole('button', { name: /save measurement/i }))

  expect(requestBody).not.toHaveProperty('matchingGroup')
})

test('edits measurement active state', async () => {
  const definition = { id: '5a829591-33dd-4dbd-998c-0e3bfb7c0ca4', pieceTypeId: pieceTypes[0].id, code: 'CHEST', label: 'Chest', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: null, defaultTolerance: null, requiredForItem: true, sortOrder: 0, active: true }
  let patchBody: Record<string, unknown> | undefined
  configureApi()
  server.use(
    http.get('*/api/piece-types/:pieceTypeId/measurement-definitions', () => HttpResponse.json([definition])),
    http.patch('*/api/measurement-definitions/:definitionId', async ({ request }) => {
      patchBody = await request.json() as Record<string, unknown>
      return HttpResponse.json({ ...definition, active: false })
    }),
  )
  const user = userEvent.setup()
  render(<InventorySettings />)

  await user.click(await screen.findByRole('button', { name: /edit chest/i }))
  await user.click(screen.getByRole('checkbox', { name: /^active$/i }))
  await user.click(screen.getByRole('button', { name: /save measurement/i }))

  expect(patchBody).toMatchObject({ active: false })
})

test('sends null when clearing an existing measurement matching group', async () => {
  const definition = { id: '5a829591-33dd-4dbd-998c-0e3bfb7c0ca4', pieceTypeId: pieceTypes[0].id, code: 'CHEST', label: 'Chest', unit: 'INCH', matchMode: 'INFORMATIONAL', matchingGroup: 'TORSO', defaultTolerance: null, requiredForItem: true, sortOrder: 0, active: true }
  let patchBody: Record<string, unknown> | undefined
  configureApi()
  server.use(
    http.get('*/api/piece-types/:pieceTypeId/measurement-definitions', () => HttpResponse.json([definition])),
    http.patch('*/api/measurement-definitions/:definitionId', async ({ request }) => {
      patchBody = await request.json() as Record<string, unknown>
      return HttpResponse.json({ ...definition, matchingGroup: null })
    }),
  )
  const user = userEvent.setup()
  render(<InventorySettings />)

  await user.click(await screen.findByRole('button', { name: /edit chest/i }))
  await user.clear(screen.getByLabelText(/matching group/i))
  await user.click(screen.getByRole('button', { name: /save measurement/i }))

  expect(patchBody).toMatchObject({ matchingGroup: null })
})
