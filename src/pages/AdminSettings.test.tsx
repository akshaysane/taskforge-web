import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import AdminSettings from './AdminSettings'
import { server } from '../test/server'

test('creates a second administrator and exposes last-admin conflicts', async () => {
  const admin = { id: '11111111-1111-4111-8111-111111111111', name: 'First Admin', email: 'first@example.test', role: 'ADMIN', active: true, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z' }
  server.use(http.get('*/api/admin-users', () => HttpResponse.json([admin])), http.post('*/api/admin-users', () => HttpResponse.json({ ...admin, id: '22222222-2222-4222-8222-222222222222', name: 'Second Admin', email: 'second@example.test' }, { status: 201 })), http.patch('*/api/admin-users/:id', () => HttpResponse.json({ code: 'LAST_ADMIN_REQUIRED', message: 'At least one active administrator is required.' }, { status: 409 })))
  const user = userEvent.setup(); render(<MemoryRouter><AdminSettings /></MemoryRouter>)
  await screen.findByText('First Admin')
  await user.click(screen.getByRole('button', { name: /add administrator/i }))
  await user.type(screen.getByLabelText(/^name$/i), 'Second Admin')
  await user.type(screen.getByLabelText(/email/i), 'second@example.test')
  await user.type(screen.getByLabelText(/^password$/i), 'long-enough-password')
  await user.click(screen.getByRole('button', { name: /save administrator/i }))
  expect(await screen.findByText('Second Admin')).toBeVisible()
})

test('shows a clear error when deactivating the last administrator is rejected', async () => {
  const admin = { id: '11111111-1111-4111-8111-111111111111', name: 'First Admin', email: 'first@example.test', role: 'ADMIN', active: true, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z' }
  server.use(http.get('*/api/admin-users', () => HttpResponse.json([admin])), http.patch('*/api/admin-users/:id', () => HttpResponse.json({ message: 'At least one active administrator is required.' }, { status: 409 })))
  const user = userEvent.setup(); render(<MemoryRouter><AdminSettings /></MemoryRouter>)
  await screen.findByText('First Admin')
  await user.click(screen.getByRole('button', { name: /deactivate first admin/i }))
  expect(await screen.findByText(/last administrator/i)).toBeVisible()
})

test('renders inactive accounts and sends rename, password reset, and reactivation updates', async () => {
  let patches: Array<Record<string, unknown>> = []
  const admin = { id: '11111111-1111-4111-8111-111111111111', name: 'Former Admin', email: 'former@example.test', role: 'ADMIN', active: false, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z' }
  server.use(http.get('*/api/admin-users', () => HttpResponse.json([admin])), http.patch('*/api/admin-users/:id', async ({ request }) => { const patch = await request.json() as Record<string, unknown>; patches = [...patches, patch]; return HttpResponse.json({ ...admin, ...patch, active: patch.active ?? admin.active }) }))
  const user = userEvent.setup(); render(<MemoryRouter><AdminSettings /></MemoryRouter>)
  expect(await screen.findByText(/inactive administrator/i)).toBeVisible()
  await user.click(screen.getByRole('button', { name: /edit former admin/i }))
  await user.clear(screen.getByLabelText(/^name$/i)); await user.type(screen.getByLabelText(/^name$/i), 'Current Admin')
  await user.type(screen.getByLabelText(/new password/i), 'renewed-password-123')
  await user.click(screen.getByRole('button', { name: /save administrator/i }))
  expect(patches[0]).toMatchObject({ name: 'Current Admin', password: 'renewed-password-123' })
  await user.click(await screen.findByRole('button', { name: /reactivate current admin/i }))
  expect(patches[1]).toMatchObject({ active: true })
  expect(await screen.findByText(/active administrator/i)).toBeVisible()
})
