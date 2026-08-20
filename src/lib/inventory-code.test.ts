import { expect, test } from 'vitest'
import { normalizeInventoryCode } from './inventory-code'

test.each([
  'A-S01-BL',
  'ABCDEFGHIJKLMNOPQRSTU-S01-BL',
  'ABCDEFGHIJKLMNOPQRST-S12345678901234567890123456-ABCDEFGHIJ-32767',
])('rejects Inventory Code %s outside Design Code or total-length boundaries', (inventoryCode) => {
  expect(normalizeInventoryCode(inventoryCode)).toBeNull()
})

test.each([
  'AB-S01-BL',
  'ABCDEFGHIJKLMNOPQRST-S2147483647-ABCDEFGHIJ-32767',
  'AB-S01-S2147483647-ABCDEFGHIJ-32767',
  'DH_AD-02-S01-BL-02',
])('accepts canonical Inventory Code boundary %s', (inventoryCode) => {
  expect(normalizeInventoryCode(inventoryCode.toLowerCase())).toBe(inventoryCode)
})

test('accepts a canonical Inventory Code at the 64-character storage boundary', () => {
  const inventoryCode = 'ABCDEFGHIJKLMNOPQRST-S1234567890123456789012345-ABCDEFGHIJ-32767'
  expect(inventoryCode).toHaveLength(64)
  expect(normalizeInventoryCode(inventoryCode)).toBe(inventoryCode)
})
