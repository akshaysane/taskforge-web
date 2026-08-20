import { normalizeInventoryCode } from './inventory-code'

export type ParsedInventoryQrPayload =
  | { ok: true; inventoryItemId: string }
  | { ok: true; inventoryCode: string }
  | { ok: false; reason: 'INVALID_CODE' | 'UNTRUSTED_ORIGIN' }

const inventoryItemIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeInventoryItemId(value: string): string | null {
  const inventoryItemId = value.trim().toLowerCase()
  return inventoryItemIdPattern.test(inventoryItemId) ? inventoryItemId : null
}

export function createInventoryDeepLink(inventoryItemId: string, baseUrl: string): string {
  const normalizedId = normalizeInventoryItemId(inventoryItemId)
  if (!normalizedId) throw new Error('Inventory item ID is invalid.')
  const origin = new URL(baseUrl).origin
  return `${origin}/inventory/items/${normalizedId}`
}

export function parseInventoryQrPayload(rawValue: string, allowedOrigin: string): ParsedInventoryQrPayload {
  const code = normalizeInventoryCode(rawValue)
  if (code) return { ok: true, inventoryCode: code }

  let parsed: URL
  let allowed: URL
  try {
    parsed = new URL(rawValue)
    allowed = new URL(allowedOrigin)
  } catch {
    return { ok: false, reason: 'INVALID_CODE' }
  }

  if (parsed.origin !== allowed.origin) return { ok: false, reason: 'UNTRUSTED_ORIGIN' }
  if (parsed.search || parsed.hash || rawValue.includes('?') || rawValue.includes('#')) return { ok: false, reason: 'INVALID_CODE' }

  const idMatch = /^\/inventory\/items\/([^/]+)$/.exec(parsed.pathname)
  if (idMatch) {
    try {
      const inventoryItemId = normalizeInventoryItemId(decodeURIComponent(idMatch[1]))
      return inventoryItemId ? { ok: true, inventoryItemId } : { ok: false, reason: 'INVALID_CODE' }
    } catch {
      return { ok: false, reason: 'INVALID_CODE' }
    }
  }

  const codeMatch = /^\/inventory\/([^/]+)$/.exec(parsed.pathname)
  let inventoryCode: string | null = null
  if (codeMatch) {
    try {
      inventoryCode = normalizeInventoryCode(decodeURIComponent(codeMatch[1]))
    } catch {
      return { ok: false, reason: 'INVALID_CODE' }
    }
  }
  return inventoryCode ? { ok: true, inventoryCode } : { ok: false, reason: 'INVALID_CODE' }
}
