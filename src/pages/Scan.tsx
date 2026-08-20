import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getInventoryItem, getInventoryItemByCode, verifyInventoryLabelById } from '../api/inventory'
import QrScanner from '../components/qr/QrScanner'
import { parseInventoryQrPayload } from '../lib/qr'

export default function Scan() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const onboarding = new URLSearchParams(location.search).get('mode') === 'onboarding'

  async function handleScan(rawValue: string) {
    const parsed = parseInventoryQrPayload(rawValue, window.location.origin)
    if (!parsed.ok) {
      setError(parsed.reason === 'UNTRUSTED_ORIGIN' ? 'This QR code is not from Nritya Alankara Collections.' : 'Enter a valid inventory code.')
      return false
    }
    setError('')
    setStatus('')
    setLookingUp(true)
    try {
      const item = 'inventoryItemId' in parsed
        ? await getInventoryItem(parsed.inventoryItemId)
        : await getInventoryItemByCode(parsed.inventoryCode)
      if (onboarding) {
        const verification = await verifyInventoryLabelById(item.id)
        setStatus(verification.alreadyVerified ? 'Already verified' : 'Label verified')
        navigate(`/inventory/items/${item.id}`, { state: { labelVerification: verification.alreadyVerified ? 'Already verified' : 'Label verified' } })
      } else {
        navigate(`/inventory/items/${item.id}`)
      }
      return true
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 404) setError('ITEM_NOT_FOUND')
      else setError('Unable to look up this inventory item. Please try again.')
      return false
    } finally {
      setLookingUp(false)
    }
  }

  return <div className="scan-page">
    <header className="scan-page-header"><h1>Scan item</h1><p>Scan a costume label to open its inventory record.</p></header>
    <QrScanner onScan={handleScan} />
    {lookingUp ? <p role="status">Finding item…</p> : null}
    {status ? <p role="status">{status}</p> : null}
    {error ? <p className="field-error" role="alert">{error}</p> : null}
  </div>
}
