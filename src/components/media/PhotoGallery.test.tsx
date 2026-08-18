import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { expect, test, vi } from 'vitest'
import PhotoGallery from './PhotoGallery'
import { server } from '../../test/server'

const photo = {
  id: 'link-1', mediaAssetId: '4e48d7f1-fdef-4b21-a2bb-9df4c7492db5', purpose: 'REFERENCE' as const, caption: 'Front reference', sortOrder: 0,
  mediaAsset: { id: '4e48d7f1-fdef-4b21-a2bb-9df4c7492db5', objectKey: 'inventory-media/photo.jpg', mimeType: 'image/jpeg' as const, byteSize: 4, checksum: null, uploadStatus: 'READY' as const, uploadedById: 'admin-1', createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z' },
}

test('retries failed lazy reads and removes an existing typed attachment', async () => {
  let reads = 0
  const detached = vi.fn()
  const onChange = vi.fn()
  server.use(
    http.get('*/api/media/:mediaAssetId/read', () => {
      reads += 1
      return reads === 1 ? HttpResponse.json({ message: 'Unavailable' }, { status: 500 }) : HttpResponse.json({ url: 'https://read.example/photo', expiresAt: '2026-08-17T00:05:00.000Z' })
    }),
    http.delete('*/api/designs/:designId/media/:mediaAssetId', () => { detached(); return new HttpResponse(null, { status: 204 }) }),
  )
  const user = userEvent.setup()
  render(<PhotoGallery photos={[photo]} ownerType="design" ownerId="design-1" onChange={onChange} />)

  await user.click(screen.getByRole('button', { name: /load photo/i }))
  expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i)
  await user.click(screen.getByRole('button', { name: /retry loading front reference/i }))
  expect(await screen.findByRole('img', { name: 'Front reference' })).toHaveAttribute('src', 'https://read.example/photo')

  await user.click(screen.getByRole('button', { name: /remove front reference/i }))
  expect(detached).toHaveBeenCalledOnce()
  expect(onChange).toHaveBeenCalledWith([])
})

test('keeps the attachment and announces a detach failure', async () => {
  server.use(http.delete('*/api/inventory-items/:inventoryItemId/media/:mediaAssetId', () => HttpResponse.json({ message: 'Media is locked.' }, { status: 409 })))
  const user = userEvent.setup()
  render(<PhotoGallery photos={[photo]} ownerType="inventory-item" ownerId="item-1" onChange={vi.fn()} />)
  await user.click(screen.getByRole('button', { name: /remove front reference/i }))
  expect(await screen.findByRole('alert')).toHaveTextContent(/could not remove/i)
})
