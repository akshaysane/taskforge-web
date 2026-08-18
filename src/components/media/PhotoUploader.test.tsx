import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import PhotoUploader from './PhotoUploader'
import type { MediaLink } from '../../api/media'
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
  expect(await screen.findByRole('alert')).toHaveTextContent(/upload failed/i)
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

test('notifies a stateful parent after upload without a render-time state update', async () => {
  server.use(
    http.post('*/api/media/uploads', () => HttpResponse.json({ mediaAsset: { ...mediaAsset, uploadStatus: 'PENDING' }, upload: { url: 'https://uploads.example/success', method: 'PUT', headers: { 'content-type': 'image/jpeg' }, expiresAt: '2026-08-17T00:05:00.000Z' } }, { status: 201 })),
    http.put('https://uploads.example/success', () => new HttpResponse(null, { status: 200 })),
    http.post('*/api/media/:mediaAssetId/complete', () => HttpResponse.json(mediaAsset)),
    http.post('*/api/designs/:designId/media/:mediaAssetId', () => HttpResponse.json({ id: 'link-1', mediaAssetId: mediaAsset.id, purpose: 'REFERENCE', caption: null, sortOrder: 0, mediaAsset }, { status: 201 })),
  )
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:success')
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  const parentChange = vi.fn()
  const user = userEvent.setup()
  function Harness() {
    const [photos, setPhotos] = useState<MediaLink[]>([])
    return <PhotoUploader ownerType="design" ownerId="design-1" purpose="REFERENCE" maxPhotos={3} existingPhotos={photos} onChange={(next) => { parentChange(next); setPhotos(next) }} />
  }
  render(<Harness />)

  await user.upload(screen.getByLabelText(/add photo/i), new File(['test'], 'success.jpg', { type: 'image/jpeg' }))
  await waitFor(() => expect(parentChange).toHaveBeenCalled())
  expect(consoleError.mock.calls.map(([message]) => String(message))).not.toContain(expect.stringContaining('Cannot update a component'))
})

test('preserves selected photo ordering when parallel uploads complete out of order', async () => {
  let uploadNumber = 0
  let releaseFirstUpload: () => void = () => undefined
  const firstUploadReleased = new Promise<void>((resolve) => { releaseFirstUpload = resolve })
  const attached: Array<{ mediaAssetId: string; sortOrder: number }> = []
  server.use(
    http.post('*/api/media/uploads', async ({ request }) => {
      const sequence = ++uploadNumber
      const input = await request.json() as { byteSize: number }
      const id = `asset-${sequence}`
      return HttpResponse.json({ mediaAsset: { ...mediaAsset, id, byteSize: input.byteSize, uploadStatus: 'PENDING' }, upload: { url: `https://uploads.example/${id}`, method: 'PUT', headers: { 'content-type': 'image/jpeg' }, expiresAt: '2026-08-17T00:05:00.000Z' } }, { status: 201 })
    }),
    http.put('https://uploads.example/asset-1', async () => { await firstUploadReleased; return new HttpResponse(null, { status: 200 }) }),
    http.put('https://uploads.example/asset-2', () => new HttpResponse(null, { status: 200 })),
    http.post('*/api/media/:mediaAssetId/complete', ({ params }) => HttpResponse.json({ ...mediaAsset, id: String(params.mediaAssetId) })),
    http.post('*/api/designs/:designId/media/:mediaAssetId', async ({ params, request }) => {
      const input = await request.json() as { sortOrder: number }
      attached.push({ mediaAssetId: String(params.mediaAssetId), sortOrder: input.sortOrder })
      return HttpResponse.json({ id: `link-${params.mediaAssetId}`, mediaAssetId: params.mediaAssetId, purpose: 'REFERENCE', caption: null, sortOrder: input.sortOrder, mediaAsset: { ...mediaAsset, id: params.mediaAssetId } }, { status: 201 })
    }),
  )
  vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`)
  const user = userEvent.setup()
  render(<PhotoUploader ownerType="design" ownerId="design-1" purpose="REFERENCE" maxPhotos={3} onChange={() => undefined} />)

  await user.upload(screen.getByLabelText(/add photo/i), [
    new File(['first'], 'first.jpg', { type: 'image/jpeg' }),
    new File(['second'], 'second.jpg', { type: 'image/jpeg' }),
  ])
  await waitFor(() => expect(attached).toHaveLength(1))
  expect(attached[0]).toEqual({ mediaAssetId: 'asset-2', sortOrder: 1 })
  releaseFirstUpload()
  await waitFor(() => expect(attached).toHaveLength(2))
  expect(attached).toContainEqual({ mediaAssetId: 'asset-1', sortOrder: 0 })
})
