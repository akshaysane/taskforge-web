import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import App from '../App'
import { server } from '../test/server'

const admin = { id: 'admin-1', email: 'owner@example.com', name: 'Owner', role: 'ADMIN' }

beforeEach(() => {
  window.history.replaceState({}, '', '/login')
})

test('submits administrator credentials and redirects without persisting a JWT', async () => {
  server.use(http.post('*/api/auth/login', () => HttpResponse.json({ accessToken: 'session-token', user: admin })))
  const user = userEvent.setup()
  render(<App />)

  await user.type(await screen.findByLabelText(/email/i), admin.email)
  await user.type(screen.getByLabelText(/password/i), 'correct-password')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  expect(await screen.findByRole('heading', { name: /inventory overview/i })).toBeVisible()
  expect(localStorage.getItem('auth-storage') ?? '').not.toContain('accessToken')
})

test('shows the API credential error', async () => {
  server.use(http.post('*/api/auth/login', () => HttpResponse.json(
    { message: 'Invalid email or password.' },
    { status: 401 },
  )))
  const user = userEvent.setup()
  render(<App />)

  await user.type(await screen.findByLabelText(/email/i), 'owner@example.com')
  await user.type(screen.getByLabelText(/password/i), 'wrong-password')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  expect(await screen.findByText('Invalid email or password.')).toBeVisible()
})
