import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import App from './App'
import { server } from './test/server'

const admin = { id: 'admin-1', email: 'owner@example.com', name: 'Owner', role: 'ADMIN' }

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
