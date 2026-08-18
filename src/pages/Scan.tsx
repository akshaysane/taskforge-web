import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getInventoryItemByCode, verifyInventoryLabel } from '../api/inventory'
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
      setError(parsed.reason === 'UNTRUSTED_ORIGIN' ? 'This QR code is not from RasikaPriya.' : 'Enter a valid inventory code.')
      return false
    }
    setError('')
    setStatus('')
    setLookingUp(true)
    try {
      const item = await getInventoryItemByCode(parsed.inventoryCode)
      if (onboarding) {
        await verifyInventoryLabel(item.inventoryCode)
        setStatus('Already verified')
      }
      navigate(`/inventory/${item.inventoryCode}`, { state: onboarding ? { labelVerification: 'Already verified' } : undefined })
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
