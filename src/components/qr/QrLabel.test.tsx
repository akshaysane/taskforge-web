import { render, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import QrLabel from './QrLabel'

const { toDataURL } = vi.hoisted(() => ({
  toDataURL: vi.fn<(payload: string) => Promise<string>>(),
}))

vi.mock('qrcode', () => ({
  toDataURL,
}))

beforeEach(() => {
  toDataURL.mockReset()
  toDataURL.mockResolvedValue('data:image/png;base64,qr-code')
})

test('reports not-ready before its QR image is generated and ready after it resolves', async () => {
  const readiness = vi.fn()
  render(<QrLabel inventoryItemId="11111111-1111-4111-8111-111111111111" inventoryCode="YP-S01-BL" onReadinessChange={readiness} />)

  expect(readiness).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', false)
  await screen.findByAltText(/qr code for yp-s01-bl/i)
  expect(readiness).toHaveBeenLastCalledWith('11111111-1111-4111-8111-111111111111', true)
})

test('encodes the immutable UUID while keeping the current inventory code accessible and visible', async () => {
  render(<QrLabel
    inventoryItemId="11111111-1111-4111-8111-111111111111"
    inventoryCode="DH-AD01-S01-BL"
    baseUrl="https://app.example.com"
  />)

  expect(await screen.findByRole('img', { name: 'QR code for DH-AD01-S01-BL' })).toBeVisible()
  expect(toDataURL).toHaveBeenCalledWith(
    'https://app.example.com/inventory/items/11111111-1111-4111-8111-111111111111',
    expect.objectContaining({ errorCorrectionLevel: 'H' }),
  )
  expect(screen.getByLabelText('QR label for DH-AD01-S01-BL')).toBeVisible()
  expect(screen.getByText('DH-AD01-S01-BL', { selector: 'strong' })).toBeVisible()
})
