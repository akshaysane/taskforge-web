import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import Scan from './Scan'
import { server } from '../test/server'

function InventoryDestination() {
  const location = useLocation()
  const { inventoryItemId } = useParams()
  const status = (location.state as { labelVerification?: string } | null)?.labelVerification
  return <><p>Item {inventoryItemId}</p><p>{status}</p></>
}

function renderOnboardingScan() {
  return render(<MemoryRouter initialEntries={['/scan?mode=onboarding']}><Routes><Route path="/scan" element={<Scan />} /><Route path="/inventory/items/:inventoryItemId" element={<InventoryDestination />} /></Routes></MemoryRouter>)
}

function mockLookupAndVerification(alreadyVerified: boolean) {
  server.use(
    http.get('*/api/inventory-items/by-code/YP-S04-BL', () => HttpResponse.json({ id: '11111111-1111-4111-8111-111111111111', inventoryCode: 'YP-S04-BL' })),
    http.post('*/api/inventory-items/11111111-1111-4111-8111-111111111111/verify-label', () => HttpResponse.json({ alreadyVerified })),
  )
}

test('loads and verifies a UUID scan by ID before navigating to its canonical route', async () => {
  let idReads = 0
  let codeReads = 0
  let idVerifications = 0
  server.use(
    http.get('*/api/inventory-items/11111111-1111-4111-8111-111111111111', () => {
      idReads += 1
      return HttpResponse.json({ id: '11111111-1111-4111-8111-111111111111', inventoryCode: 'DH-AD01-S01-BL' })
    }),
    http.get('*/api/inventory-items/by-code/:code', () => {
      codeReads += 1
      return HttpResponse.json({ id: 'wrong-item', inventoryCode: 'WRONG-S01-BL' })
    }),
    http.post('*/api/inventory-items/11111111-1111-4111-8111-111111111111/verify-label', () => {
      idVerifications += 1
      return HttpResponse.json({ alreadyVerified: false })
    }),
  )
  const user = userEvent.setup()
  renderOnboardingScan()

  await user.type(screen.getByLabelText(/enter inventory code/i), `${window.location.origin}/inventory/items/11111111-1111-4111-8111-111111111111`)
  await user.click(screen.getByRole('button', { name: /find item/i }))

  expect(await screen.findByText('Item 11111111-1111-4111-8111-111111111111')).toBeVisible()
  expect(screen.getByText('Label verified')).toBeVisible()
  expect(idReads).toBe(1)
  expect(codeReads).toBe(0)
  expect(idVerifications).toBe(1)
})

test('resolves a legacy code and navigates to the returned item UUID route', async () => {
  let lookupCode = ''
  server.use(
    http.get('*/api/inventory-items/by-code/:code', ({ params }) => {
      lookupCode = String(params.code)
      return HttpResponse.json({ id: '11111111-1111-4111-8111-111111111111', inventoryCode: 'DH-AD02-S01-BL' })
    }),
    http.post('*/api/inventory-items/11111111-1111-4111-8111-111111111111/verify-label', () => HttpResponse.json({ alreadyVerified: false })),
  )
  const user = userEvent.setup()
  renderOnboardingScan()

  await user.type(screen.getByLabelText(/enter inventory code/i), 'DH-AD01-S01-BL')
  await user.click(screen.getByRole('button', { name: /find item/i }))

  expect(await screen.findByText('Item 11111111-1111-4111-8111-111111111111')).toBeVisible()
  expect(screen.getByText('Label verified')).toBeVisible()
  expect(lookupCode).toBe('DH-AD01-S01-BL')
})

test('shows Label verified after the first onboarding label scan', async () => {
  mockLookupAndVerification(false)
  const user = userEvent.setup()
  renderOnboardingScan()

  await user.type(screen.getByLabelText(/enter inventory code/i), 'YP-S04-BL')
  await user.click(screen.getByRole('button', { name: /find item/i }))

  expect(await screen.findByText('Label verified')).toBeVisible()
})

test('shows Already verified after an idempotent onboarding scan', async () => {
  mockLookupAndVerification(true)
  const user = userEvent.setup()
  renderOnboardingScan()

  await user.type(screen.getByLabelText(/enter inventory code/i), 'YP-S04-BL')
  await user.click(screen.getByRole('button', { name: /find item/i }))

  expect(await screen.findByText('Already verified')).toBeVisible()
})
