import { useEffect, useState } from 'react'
import { recordLabelPrinted } from '../../api/inventory'
import { createInventoryDeepLink } from '../../lib/qr'

interface QrLabelProps {
  inventoryItemId: string
  inventoryCode: string
  designName?: string
  pieceName?: string
  baseUrl?: string
  onReadinessChange?: (inventoryItemId: string, ready: boolean) => void
}

export default function QrLabel({ inventoryItemId, inventoryCode, designName, pieceName, baseUrl = window.location.origin, onReadinessChange }: QrLabelProps) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [qrError, setQrError] = useState('')
  const [printError, setPrintError] = useState('')
  const payload = createInventoryDeepLink(inventoryItemId, baseUrl)

  useEffect(() => {
    let active = true
    onReadinessChange?.(inventoryItemId, false)
    void import('qrcode').then((QRCode) => QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 320,
      color: { dark: '#000000', light: '#FFFFFF' },
    })).then((dataUrl) => {
      if (active) { setQrDataUrl(dataUrl); onReadinessChange?.(inventoryItemId, true) }
    }).catch(() => {
      if (active) { setQrError('Unable to generate this QR label.'); onReadinessChange?.(inventoryItemId, false) }
    })
    return () => { active = false }
  }, [inventoryItemId, onReadinessChange, payload])

  async function printLabel() {
    setPrintError('')
    try {
      await recordLabelPrinted(inventoryItemId)
      window.print()
    } catch {
      setPrintError('Unable to record this print. Please try again.')
    }
  }

  return <section className="qr-label-section" aria-label={`QR label for ${inventoryCode}`}>
    <div className="qr-label">
      {qrDataUrl ? <img src={qrDataUrl} alt={`QR code for ${inventoryCode}`} /> : <div className="qr-label-loading" aria-live="polite">Generating QR code…</div>}
      <div className="qr-label-copy"><strong>{inventoryCode}</strong>{designName ? <span>{designName}</span> : null}{pieceName ? <span>{pieceName}</span> : null}</div>
    </div>
    {qrError || printError ? <p className="field-error" role="alert">{qrError || printError}</p> : null}
    <button className="button qr-print-button" type="button" onClick={() => void printLabel()} disabled={!qrDataUrl}>Print label</button>
  </section>
}
