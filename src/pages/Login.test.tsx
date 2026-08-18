import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import App from '../App'
import { server } from '../test/server'

const admin = { id: 'admin-1', username: 'srnatiya-admin', email: null, name: 'Owner', role: 'ADMIN' }

beforeEach(() => {
  window.history.replaceState({}, '', '/login')
})

test('submits administrator credentials and redirects without persisting a JWT', async () => {
  let submittedBody: unknown
  server.use(http.post('*/api/auth/login', async ({ request }) => {
    submittedBody = await request.json()
    return HttpResponse.json({ accessToken: 'session-token', user: admin })
  }))
  const user = userEvent.setup()
  render(<App />)

  expect(await screen.findByLabelText('SR Natiya Dance Shop')).toBeVisible()
  await user.type(screen.getByLabelText(/username/i), admin.username)
  await user.type(screen.getByLabelText(/password/i), 'correct-password')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  expect(await screen.findByRole('heading', { name: /inventory overview/i })).toBeVisible()
  expect(submittedBody).toEqual({ username: 'srnatiya-admin', password: 'correct-password' })
  expect(localStorage.getItem('auth-storage') ?? '').not.toContain('accessToken')
})

test('shows the API credential error', async () => {
  server.use(http.post('*/api/auth/login', () => HttpResponse.json(
    { message: 'Invalid username or password.' },
    { status: 401 },
  )))
  const user = userEvent.setup()
  render(<App />)

  await user.type(await screen.findByLabelText(/username/i), 'srnatiya-admin')
  await user.type(screen.getByLabelText(/password/i), 'wrong-password')
  await user.click(screen.getByRole('button', { name: /sign in/i }))

  expect(await screen.findByText('Invalid username or password.')).toBeVisible()
})
