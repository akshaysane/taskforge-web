import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { expect, test } from 'vitest'
import OriginalSets from './OriginalSets'
import { server } from '../test/server'

const design = { id: '4e48d7f1-fdef-4b21-a2bb-9df4c7492db5', designCode: 'YP', name: 'Yellow / Purple Dhoti', costumeType: 'Dhoti', primaryColor: 'Yellow', secondaryColor: 'Purple', description: null, archivedAt: null, createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z', originalSetCount: 1, pieceRequirements: [], media: [] }
const set = { id: '2e48d7f1-fdef-4b21-a2bb-9df4c7492db5', designId: design.id, originalSetCode: 'YP-S04', sequenceNumber: 4, notes: null, verifiedAt: null, verifiedById: null, archivedAt: null, createdAt: design.createdAt, updatedAt: design.updatedAt, inventoryItemCount: 2 }

function Location() { return <output aria-label="location">{useLocation().pathname}</output> }

test('creates the next set and navigates to its resumable onboarding route', async () => {
  server.use(
    http.get('*/api/designs', () => HttpResponse.json([design])),
    http.get('*/api/original-sets', () => HttpResponse.json([])),
    http.post('*/api/original-sets', () => HttpResponse.json(set, { status: 201 })),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><OriginalSets /><Location /></MemoryRouter>)

  await user.selectOptions(await screen.findByLabelText(/active design/i), design.id)
  await user.click(screen.getByRole('button', { name: /onboard next set/i }))

  expect(await screen.findByLabelText('location')).toHaveTextContent(`/original-sets/${set.id}`)
})

test('filters by design and routes verified sets to View', async () => {
  const secondDesign = { ...design, id: '3e48d7f1-fdef-4b21-a2bb-9df4c7492db5', designCode: 'RB', name: 'Red Blouse' }
  server.use(
    http.get('*/api/designs', () => HttpResponse.json([design, secondDesign])),
    http.get('*/api/original-sets', () => HttpResponse.json([{ ...set, verifiedAt: '2026-08-17T01:00:00.000Z' }, { ...set, id: '1e48d7f1-fdef-4b21-a2bb-9df4c7492db5', originalSetCode: 'RB-S01', designId: secondDesign.id }])),
  )
  const user = userEvent.setup()
  render(<MemoryRouter><OriginalSets /><Location /></MemoryRouter>)

  await user.selectOptions(await screen.findByLabelText(/^design$/i), design.id)
  expect(screen.getByText('YP-S04')).toBeVisible()
  expect(screen.queryByText('RB-S01')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /view yp-s04/i }))
  expect(screen.getByLabelText('location')).toHaveTextContent(`/original-sets/${set.id}`)
})
