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
