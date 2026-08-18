import { normalizeInventoryCode } from './inventory-code'

export type ParsedInventoryQrPayload =
  | { ok: true; inventoryCode: string }
  | { ok: false; reason: 'INVALID_CODE' | 'UNTRUSTED_ORIGIN' }

export function createInventoryDeepLink(inventoryCode: string, baseUrl: string): string {
  const normalizedCode = normalizeInventoryCode(inventoryCode)
  if (!normalizedCode) throw new Error('Inventory code is invalid.')
  const origin = new URL(baseUrl).origin
  return `${origin}/inventory/${normalizedCode}`
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
  const match = /^\/inventory\/([^/]+)$/.exec(parsed.pathname)
  let inventoryCode: string | null = null
  if (match) {
    try {
      inventoryCode = normalizeInventoryCode(decodeURIComponent(match[1]))
    } catch {
      return { ok: false, reason: 'INVALID_CODE' }
    }
  }
  return inventoryCode ? { ok: true, inventoryCode } : { ok: false, reason: 'INVALID_CODE' }
}
