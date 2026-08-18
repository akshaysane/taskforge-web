import { describe, expect, test, vi } from 'vitest'
import { createRequestId } from './requestId'

describe('createRequestId', () => {
  test('uses the browser UUID API when the page is a secure context', () => {
    const randomUUID = vi.fn(() => '123e4567-e89b-42d3-a456-426614174000' as `${string}-${string}-${string}-${string}-${string}`)

    expect(createRequestId({ randomUUID, getRandomValues: vi.fn() })).toBe('123e4567-e89b-42d3-a456-426614174000')
    expect(randomUUID).toHaveBeenCalledOnce()
  })

  test('creates a UUID with getRandomValues when randomUUID is unavailable on LAN HTTP', () => {
    const bytes = Uint8Array.from({ length: 16 }, (_, index) => index)
    const getRandomValues = vi.fn((target: Uint8Array) => {
      target.set(bytes)
      return target
    })

    expect(createRequestId({ getRandomValues })).toBe('00010203-0405-4607-8809-0a0b0c0d0e0f')
    expect(getRandomValues).toHaveBeenCalledOnce()
  })
})
