import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import Dashboard from './Dashboard'
import { server } from '../test/server'

test('renders server metrics, deep links and the original-set attention callout', async () => {
  server.use(http.get('*/api/dashboard/inventory-summary', () => HttpResponse.json({ total: 18, available: 12, cleaning: 2, repairRequired: 1, alterationRequired: 1, missing: 1, retired: 1, originalSets: { total: 5, verified: 2, incomplete: 3 } })))
  render(<MemoryRouter><Dashboard /></MemoryRouter>)
  expect(await screen.findByText('18')).toBeVisible()
  expect(screen.getByRole('link', { name: /12 available/i })).toHaveAttribute('href', '/inventory?availability=AVAILABLE')
  expect(screen.getByRole('link', { name: /3 original sets need onboarding/i })).toHaveAttribute('href', '/original-sets')
})

test('renders a dashboard error state', async () => {
  server.use(http.get('*/api/dashboard/inventory-summary', () => HttpResponse.json({ message: 'Dashboard unavailable.' }, { status: 500 })))
  render(<MemoryRouter><Dashboard /></MemoryRouter>)
  expect(await screen.findByText('Dashboard unavailable.')).toBeVisible()
})
