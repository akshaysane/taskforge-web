export const inventoryCodePattern = /^[A-Z]{2,10}-S[0-9]{2,}-[A-Z]{2,10}(?:-[0-9]{2,})?$/

export function normalizeInventoryCode(value: string): string | null {
  const inventoryCode = value.trim().toUpperCase()
  return inventoryCodePattern.test(inventoryCode) ? inventoryCode : null
}
