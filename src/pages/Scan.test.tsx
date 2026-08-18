import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import Scan from './Scan'
import { server } from '../test/server'

function InventoryDestination() {
  const location = useLocation()
  const status = (location.state as { labelVerification?: string } | null)?.labelVerification
  return <p>{status}</p>
}

function renderOnboardingScan() {
  return render(<MemoryRouter initialEntries={['/scan?mode=onboarding']}><Routes><Route path="/scan" element={<Scan />} /><Route path="/inventory/:inventoryCode" element={<InventoryDestination />} /></Routes></MemoryRouter>)
}

function mockLookupAndVerification(alreadyVerified: boolean) {
  server.use(
    http.get('*/api/inventory-items/by-code/YP-S04-BL', () => HttpResponse.json({ id: 'item-1', inventoryCode: 'YP-S04-BL' })),
    http.post('*/api/inventory-items/by-code/YP-S04-BL/verify-label', () => HttpResponse.json({ alreadyVerified })),
  )
}

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
