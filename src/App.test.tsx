import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import App from './App'
import { server } from './test/server'

const admin = { id: 'admin-1', username: 'srnatiya-admin', email: null, name: 'Owner', role: 'ADMIN' }

beforeEach(() => {
  window.history.replaceState({}, '', '/dashboard')
})

test('bootstraps the cookie session before rendering a protected route', async () => {
  server.use(http.post('*/api/auth/refresh', () => HttpResponse.json({ accessToken: 'fresh-token', user: admin })))
  render(<App />)

  expect(await screen.findByRole('heading', { name: /inventory overview/i })).toBeVisible()
})

test('marks Scan as the prominent mobile navigation action', async () => {
  server.use(http.post('*/api/auth/refresh', () => HttpResponse.json({ accessToken: 'fresh-token', user: admin })))
  render(<App />)

  await screen.findByRole('heading', { name: /inventory overview/i })
  const mobileNav = document.querySelector<HTMLElement>('.mobile-nav')
  expect(mobileNav).not.toBeNull()
  expect(within(mobileNav!).getByRole('link', { name: 'Scan' })).toHaveClass('mobile-nav-scan')
})

test('registers the canonical inventory UUID detail route', async () => {
  const inventoryItemId = '11111111-1111-4111-8111-111111111111'
  const item = {
    id: inventoryItemId,
    originalSetId: '22222222-2222-4222-8222-222222222222',
    pieceTypeId: '33333333-3333-4333-8333-333333333333',
    pieceSequence: 1,
    inventoryCode: 'DH-AD01-S01-BL',
    lifecycleStatus: 'ACTIVE',
    condition: 'EXCELLENT',
    customSize: null,
    storageLocation: null,
    alterationAllowance: null,
    notes: null,
    purchaseCost: null,
    stitchingCost: null,
    archivedAt: null,
    version: 1,
    createdAt: '2026-08-19T00:00:00.000Z',
    updatedAt: '2026-08-19T00:00:00.000Z',
    measurements: [],
  }
  server.use(
    http.post('*/api/auth/refresh', () => HttpResponse.json({ accessToken: 'fresh-token', user: admin })),
    http.get(`*/api/inventory-items/${inventoryItemId}`, () => HttpResponse.json(item)),
    http.get(`*/api/inventory-items/${inventoryItemId}/events`, () => HttpResponse.json([])),
  )

  render(<App />)
  await screen.findByRole('heading', { name: /inventory overview/i })
  window.history.pushState({}, '', `/inventory/items/${inventoryItemId}`)
  window.dispatchEvent(new PopStateEvent('popstate'))

  expect(await screen.findByRole('heading', { name: item.inventoryCode })).toBeVisible()
})
