import { expect, test } from 'vitest'
import { createInventoryDeepLink, parseInventoryQrPayload } from './qr'

test('creates a canonical deep link from a normalized inventory code', () => {
  expect(createInventoryDeepLink(' yp-s04-bl ', 'https://app.example.com')).toBe('https://app.example.com/inventory/YP-S04-BL')
})

test('accepts a same-origin inventory deep link', () => {
  expect(parseInventoryQrPayload('https://app.example.com/inventory/YP-S04-BL', 'https://app.example.com'))
    .toEqual({ ok: true, inventoryCode: 'YP-S04-BL' })
})

test('accepts a human-readable inventory code', () => {
  expect(parseInventoryQrPayload(' yp-s04-bl-02 ', 'https://app.example.com'))
    .toEqual({ ok: true, inventoryCode: 'YP-S04-BL-02' })
})

test('rejects a deep link from another origin', () => {
  expect(parseInventoryQrPayload('https://evil.example/inventory/YP-S04-BL', 'https://app.example.com'))
    .toEqual({ ok: false, reason: 'UNTRUSTED_ORIGIN' })
})

test('rejects a non-inventory URL and malformed inventory code', () => {
  expect(parseInventoryQrPayload('https://app.example.com/designs/YP-S04-BL', 'https://app.example.com'))
    .toEqual({ ok: false, reason: 'INVALID_CODE' })
  expect(parseInventoryQrPayload('YP-S4-BL', 'https://app.example.com'))
    .toEqual({ ok: false, reason: 'INVALID_CODE' })
})

test('rejects a malformed URL-encoded code without throwing', () => {
  expect(parseInventoryQrPayload('https://app.example.com/inventory/%', 'https://app.example.com'))
    .toEqual({ ok: false, reason: 'INVALID_CODE' })
})

test('rejects same-origin deep links with query strings or fragments', () => {
  expect(parseInventoryQrPayload('https://app.example.com/inventory/YP-S04-BL?source=label', 'https://app.example.com'))
    .toEqual({ ok: false, reason: 'INVALID_CODE' })
  expect(parseInventoryQrPayload('https://app.example.com/inventory/YP-S04-BL#label', 'https://app.example.com'))
    .toEqual({ ok: false, reason: 'INVALID_CODE' })
})

test('rejects same-origin deep links with bare query and fragment delimiters', () => {
  for (const suffix of ['?', '#', '?#']) {
    expect(parseInventoryQrPayload(`https://app.example.com/inventory/YP-S04-BL${suffix}`, 'https://app.example.com'))
      .toEqual({ ok: false, reason: 'INVALID_CODE' })
  }
})
