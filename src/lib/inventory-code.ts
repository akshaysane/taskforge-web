const designCodePattern = /^[A-Z0-9]+(?:[-_][A-Z0-9]+)*$/
const setSequencePattern = /^S[0-9]{2,}$/
const pieceTypeCodePattern = /^[A-Z]{2,10}$/
const pieceSequencePattern = /^[0-9]{2,}$/

export function normalizeInventoryCode(value: string): string | null {
  const inventoryCode = value.trim().toUpperCase()
  if (inventoryCode.length > 64) return null

  const segments = inventoryCode.split('-')
  if (pieceSequencePattern.test(segments.at(-1) ?? '')) segments.pop()
  const pieceTypeCode = segments.pop() ?? ''
  const setSequence = segments.pop() ?? ''
  const designCode = segments.join('-')

  if (designCode.length < 2 || designCode.length > 20 || !designCodePattern.test(designCode)) return null
  if (!setSequencePattern.test(setSequence) || !pieceTypeCodePattern.test(pieceTypeCode)) return null
  return inventoryCode
}
