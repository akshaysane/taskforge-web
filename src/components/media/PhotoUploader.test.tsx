import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { expect, test, vi } from 'vitest'
import PhotoUploader from './PhotoUploader'
import { server } from '../../test/server'

const mediaAsset = {
  id: '4e48d7f1-fdef-4b21-a2bb-9df4c7492db5', objectKey: 'inventory-media/4e48d7f1-fdef-4b21-a2bb-9df4c7492db5.jpg', mimeType: 'image/jpeg', byteSize: 4,
  checksum: null, uploadStatus: 'READY', uploadedById: '4e48d7f1-fdef-4b21-a2bb-9df4c7492db5', createdAt: '2026-08-17T00:00:00.000Z', updatedAt: '2026-08-17T00:00:00.000Z',
}

test('rejects oversized files before issuing a media request', async () => {
  const createUpload = vi.fn()
  server.use(http.post('*/api/media/uploads', createUpload))
  const user = userEvent.setup()
  render(<PhotoUploader ownerType="design" ownerId="design-1" purpose="REFERENCE" maxPhotos={3} onChange={() => undefined} />)

  const oversized = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.jpg', { type: 'image/jpeg' })
  await user.upload(screen.getByLabelText(/add photo/i), oversized)

  expect(await screen.findByText(/10 MB or smaller/i)).toBeVisible()
  expect(createUpload).not.toHaveBeenCalled()
})

test('uploads with presigned headers, completes, attaches, previews, and retries after a failed PUT', async () => {
  let uploadAttempt = 0
  let attached = false
  server.use(
    http.post('*/api/media/uploads', () => HttpResponse.json({ mediaAsset: { ...mediaAsset, uploadStatus: 'PENDING' }, upload: { url: 'https://uploads.example/photo', method: 'PUT', headers: { 'content-type': 'image/jpeg' }, expiresAt: '2026-08-17T00:05:00.000Z' } }, { status: 201 })),
    http.put('https://uploads.example/photo', async ({ request }) => {
      uploadAttempt += 1
      expect(request.headers.get('content-type')).toBe('image/jpeg')
      return uploadAttempt === 1 ? new HttpResponse(null, { status: 500 }) : new HttpResponse(null, { status: 200 })
    }),
    http.post('*/api/media/:mediaAssetId/complete', () => HttpResponse.json(mediaAsset)),
    http.post('*/api/designs/:designId/media/:mediaAssetId', () => { attached = true; return HttpResponse.json({ id: 'link-1', mediaAssetId: mediaAsset.id, purpose: 'REFERENCE', caption: null, sortOrder: 0, mediaAsset }, { status: 201 }) }),
    http.delete('*/api/designs/:designId/media/:mediaAssetId', () => new HttpResponse(null, { status: 204 })),
  )
  const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview')
  const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL')
  const user = userEvent.setup()
  render(<PhotoUploader ownerType="design" ownerId="design-1" purpose="REFERENCE" maxPhotos={3} onChange={() => undefined} />)

  await user.upload(screen.getByLabelText(/add photo/i), new File(['test'], 'photo.jpg', { type: 'image/jpeg' }))
  expect(await screen.findByText(/upload failed/i)).toBeVisible()
  await user.click(screen.getByRole('button', { name: /retry photo.jpg/i }))

  await waitFor(() => expect(attached).toBe(true))
  expect(screen.getByRole('img', { name: /photo.jpg/i })).toHaveAttribute('src', 'blob:preview')
  expect(createObjectUrl).toHaveBeenCalledOnce()
  await user.click(screen.getByRole('button', { name: /remove photo.jpg/i }))
  expect(revokeObjectUrl).toHaveBeenCalledWith('blob:preview')
})

test('keeps removal unavailable while an upload is in flight', async () => {
  let releaseUpload: () => void = () => undefined
  const uploadFinished = new Promise<void>((resolve) => { releaseUpload = resolve })
  server.use(
    http.post('*/api/media/uploads', () => HttpResponse.json({ mediaAsset: { ...mediaAsset, uploadStatus: 'PENDING' }, upload: { url: 'https://uploads.example/pending', method: 'PUT', headers: { 'content-type': 'image/jpeg' }, expiresAt: '2026-08-17T00:05:00.000Z' } }, { status: 201 })),
    http.put('https://uploads.example/pending', async () => { await uploadFinished; return new HttpResponse(null, { status: 200 }) }),
    http.post('*/api/media/:mediaAssetId/complete', () => HttpResponse.json(mediaAsset)),
    http.post('*/api/designs/:designId/media/:mediaAssetId', () => HttpResponse.json({ id: 'link-1', mediaAssetId: mediaAsset.id, purpose: 'REFERENCE', caption: null, sortOrder: 0, mediaAsset }, { status: 201 })),
  )
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pending')
  const user = userEvent.setup()
  render(<PhotoUploader ownerType="design" ownerId="design-1" purpose="REFERENCE" maxPhotos={3} onChange={() => undefined} />)

  await user.upload(screen.getByLabelText(/add photo/i), new File(['test'], 'pending.jpg', { type: 'image/jpeg' }))
  expect(await screen.findByRole('status')).toHaveTextContent(/uploading pending.jpg/i)
  expect(screen.getByRole('button', { name: /remove pending.jpg/i })).toBeDisabled()

  releaseUpload()
  await screen.findByRole('img', { name: 'pending.jpg' })
})
