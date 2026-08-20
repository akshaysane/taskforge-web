import { expect, test } from 'vitest'
import { createInventoryDeepLink, parseInventoryQrPayload } from './qr'

test('creates a canonical deep link from an immutable inventory item UUID', () => {
  expect(createInventoryDeepLink(
    '11111111-1111-4111-8111-111111111111',
    'https://app.example.com',
  )).toBe('https://app.example.com/inventory/items/11111111-1111-4111-8111-111111111111')
})

test('rejects a malformed inventory item UUID when creating a deep link', () => {
  expect(() => createInventoryDeepLink('not-a-uuid', 'https://app.example.com'))
    .toThrow(/inventory item id/i)
})

test('accepts a same-origin inventory UUID deep link', () => {
  expect(parseInventoryQrPayload(
    'https://app.example.com/inventory/items/11111111-1111-4111-8111-111111111111',
    'https://app.example.com',
  )).toEqual({ ok: true, inventoryItemId: '11111111-1111-4111-8111-111111111111' })
})

test('accepts a same-origin legacy inventory-code deep link', () => {
  expect(parseInventoryQrPayload('https://app.example.com/inventory/DH-AD01-S01-BL', 'https://app.example.com'))
    .toEqual({ ok: true, inventoryCode: 'DH-AD01-S01-BL' })
})

test('accepts a human-readable inventory code with an underscored design prefix', () => {
  expect(parseInventoryQrPayload(' dh_ad01-s01-bl ', 'https://app.example.com'))
    .toEqual({ ok: true, inventoryCode: 'DH_AD01-S01-BL' })
})

test.each([
  'A-S01-BL',
  'ABCDEFGHIJKLMNOPQRSTU-S01-BL',
  'ABCDEFGHIJKLMNOPQRST-S12345678901234567890123456-ABCDEFGHIJ-32767',
])('rejects QR Inventory Code %s outside Design Code or total-length boundaries', (inventoryCode) => {
  expect(parseInventoryQrPayload(inventoryCode, 'https://app.example.com'))
    .toEqual({ ok: false, reason: 'INVALID_CODE' })
})

test.each([
  'AB-S01-BL',
  'ABCDEFGHIJKLMNOPQRST-S2147483647-ABCDEFGHIJ-32767',
  'AB-S01-S2147483647-ABCDEFGHIJ-32767',
  'DH_AD-02-S01-BL-02',
])('accepts QR Inventory Code boundary %s', (inventoryCode) => {
  expect(parseInventoryQrPayload(inventoryCode, 'https://app.example.com'))
    .toEqual({ ok: true, inventoryCode })
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

test.each([
  '11111111-1111-0111-8111-111111111111',
  '11111111-1111-4111-7111-111111111111',
  '11111111-1111-4111-8111-11111111111',
])('rejects a malformed UUID deep link containing %s', (inventoryItemId) => {
  expect(parseInventoryQrPayload(
    `https://app.example.com/inventory/items/${inventoryItemId}`,
    'https://app.example.com',
  )).toEqual({ ok: false, reason: 'INVALID_CODE' })
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
  expect(parseInventoryQrPayload('https://app.example.com/inventory/items/11111111-1111-4111-8111-111111111111?source=label', 'https://app.example.com'))
    .toEqual({ ok: false, reason: 'INVALID_CODE' })
  expect(parseInventoryQrPayload('https://app.example.com/inventory/items/11111111-1111-4111-8111-111111111111#label', 'https://app.example.com'))
    .toEqual({ ok: false, reason: 'INVALID_CODE' })
})

test('rejects same-origin deep links with bare query and fragment delimiters', () => {
  for (const suffix of ['?', '#', '?#']) {
    expect(parseInventoryQrPayload(`https://app.example.com/inventory/YP-S04-BL${suffix}`, 'https://app.example.com'))
      .toEqual({ ok: false, reason: 'INVALID_CODE' })
  }
})
