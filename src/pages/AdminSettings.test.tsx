import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import AdminSettings from './AdminSettings'
import { server } from '../test/server'

test('creates a second administrator and exposes last-admin conflicts', async () => {
  let submittedBody: unknown
  const admin = { id: '11111111-1111-4111-8111-111111111111', username: 'first-admin', name: 'First Admin', email: 'first@example.test', role: 'ADMIN', active: true, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z' }
  server.use(http.get('*/api/admin-users', () => HttpResponse.json([admin])), http.post('*/api/admin-users', async ({ request }) => { submittedBody = await request.json(); return HttpResponse.json({ ...admin, id: '22222222-2222-4222-8222-222222222222', username: 'second-admin', name: 'Second Admin', email: null }, { status: 201 }) }), http.patch('*/api/admin-users/:id', () => HttpResponse.json({ code: 'LAST_ADMIN_REQUIRED', message: 'At least one active administrator is required.' }, { status: 409 })))
  const user = userEvent.setup(); render(<MemoryRouter><AdminSettings /></MemoryRouter>)
  await screen.findByText('First Admin')
  await user.click(screen.getByRole('button', { name: /add administrator/i }))
  await user.type(screen.getByLabelText(/^name$/i), 'Second Admin')
  await user.type(screen.getByLabelText(/username/i), 'second-admin')
  await user.type(screen.getByLabelText(/^password$/i), 'long-enough-password')
  await user.click(screen.getByRole('button', { name: /save administrator/i }))
  expect(await screen.findByText('Second Admin')).toBeVisible()
  expect(submittedBody).toEqual({ name: 'Second Admin', username: 'second-admin', email: null, password: 'long-enough-password' })
})

test('shows a clear error when deactivating the last administrator is rejected', async () => {
  const admin = { id: '11111111-1111-4111-8111-111111111111', username: 'first-admin', name: 'First Admin', email: 'first@example.test', role: 'ADMIN', active: true, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z' }
  server.use(http.get('*/api/admin-users', () => HttpResponse.json([admin])), http.patch('*/api/admin-users/:id', () => HttpResponse.json({ message: 'At least one active administrator is required.' }, { status: 409 })))
  const user = userEvent.setup(); render(<MemoryRouter><AdminSettings /></MemoryRouter>)
  await screen.findByText('First Admin')
  await user.click(screen.getByRole('button', { name: /deactivate first admin/i }))
  expect(await screen.findByText(/last administrator/i)).toBeVisible()
})

test('renders inactive accounts and sends rename, password reset, and reactivation updates', async () => {
  let patches: Array<Record<string, unknown>> = []
  const admin = { id: '11111111-1111-4111-8111-111111111111', username: 'former-admin', name: 'Former Admin', email: 'former@example.test', role: 'ADMIN', active: false, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z' }
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

test('keeps the administrator editor open and renders server validation errors', async () => {
  server.use(http.get('*/api/admin-users', () => HttpResponse.json([])), http.post('*/api/admin-users', () => HttpResponse.json({ message: 'Password must have 12 characters.' }, { status: 400 })))
  const user = userEvent.setup(); render(<MemoryRouter><AdminSettings /></MemoryRouter>)
  await user.click(await screen.findByRole('button', { name: /add administrator/i }))
  await user.type(screen.getByLabelText(/^name$/i), 'Admin'); await user.type(screen.getByLabelText(/username/i), 'new-admin'); await user.type(screen.getByLabelText(/^password$/i), 'long-enough-password')
  await user.click(screen.getByRole('button', { name: /save administrator/i }))
  const dialog = screen.getByRole('dialog', { name: /add administrator/i })
  expect(await within(dialog).findByText(/password must have/i)).toBeVisible()
})

test('keeps the edit administrator sheet open when rename validation fails', async () => {
  const administrator = { id: '11111111-1111-4111-8111-111111111111', username: 'existing-admin', name: 'Existing admin', email: 'existing@example.test', role: 'ADMIN', active: true, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z' }
  server.use(http.get('*/api/admin-users', () => HttpResponse.json([administrator])), http.patch('*/api/admin-users/:id', () => HttpResponse.json({ message: 'Name is already in use.' }, { status: 400 })))
  const user = userEvent.setup(); render(<MemoryRouter><AdminSettings /></MemoryRouter>)
  await user.click(await screen.findByRole('button', { name: /edit existing admin/i }))
  await user.clear(screen.getByLabelText(/^name$/i)); await user.type(screen.getByLabelText(/^name$/i), 'Duplicate name')
  await user.click(screen.getByRole('button', { name: /save administrator/i }))
  const dialog = screen.getByRole('dialog', { name: /edit administrator/i })
  expect(await within(dialog).findByText(/name is already in use/i)).toBeVisible()
})
