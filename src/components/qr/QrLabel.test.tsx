import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import QrLabel from './QrLabel'

test('reports not-ready before its QR image is generated and ready after it resolves', async () => {
  const readiness = vi.fn()
  render(<QrLabel inventoryItemId="item-1" inventoryCode="YP-S01-BL" onReadinessChange={readiness} />)

  expect(readiness).toHaveBeenCalledWith('item-1', false)
  await screen.findByAltText(/qr code for yp-s01-bl/i)
  expect(readiness).toHaveBeenLastCalledWith('item-1', true)
})
