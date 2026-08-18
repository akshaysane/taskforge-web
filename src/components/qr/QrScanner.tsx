import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

type ScannerControls = { stop: () => void }
type DecodeResult = { getText: () => string } | undefined
type BrowserReader = {
  decodeFromConstraints: (
    constraints: MediaStreamConstraints,
    video: HTMLVideoElement,
    callback: (result: DecodeResult, error: unknown, controls: ScannerControls) => void,
  ) => Promise<ScannerControls>
}
type BrowserReaderConstructor = new () => BrowserReader

interface QrScannerProps {
  onScan: (rawValue: string) => boolean | Promise<boolean>
  loadReader?: () => Promise<BrowserReaderConstructor>
  manualLabel?: string
  submitLabel?: string
}

function cameraDenied(error: unknown): boolean {
  return error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')
}

async function loadBrowserReader(): Promise<BrowserReaderConstructor> {
  const module = await import('@zxing/browser') as { BrowserQRCodeReader: BrowserReaderConstructor }
  return module.BrowserQRCodeReader
}

export default function QrScanner({ onScan, loadReader = loadBrowserReader, manualLabel = 'Enter inventory code', submitLabel = 'Find item' }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<ScannerControls | null>(null)
  const stoppedControlsRef = useRef(new WeakSet<ScannerControls>())
  const handledRef = useRef(false)
  const sessionRef = useRef(0)
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'active' | 'denied' | 'error'>('idle')
  const [manualCode, setManualCode] = useState('')

  const stopControls = useCallback((controls: ScannerControls) => {
    if (stoppedControlsRef.current.has(controls)) return
    stoppedControlsRef.current.add(controls)
    controls.stop()
  }, [])

  const stopCamera = useCallback(() => {
    const controls = controlsRef.current
    controlsRef.current = null
    if (controls) stopControls(controls)
  }, [stopControls])

  useEffect(() => () => {
    sessionRef.current += 1
    stopCamera()
  }, [stopCamera])

  const completeScan = useCallback((rawValue: string, controls?: ScannerControls) => {
    if (handledRef.current) return
    handledRef.current = true
    if (controls) {
      controlsRef.current = controls
    }
    stopCamera()
    void Promise.resolve(onScan(rawValue)).then(() => {
      handledRef.current = false
    }).catch(() => {
      handledRef.current = false
    })
  }, [onScan, stopCamera])

  async function startCamera() {
    const session = sessionRef.current + 1
    sessionRef.current = session
    handledRef.current = false
    setCameraState('starting')
    try {
      const Reader = await loadReader()
      if (session !== sessionRef.current) return
      const video = videoRef.current
      if (!video) return
      const reader = new Reader()
      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        video,
        (result, _error, scannerControls) => {
          if (session !== sessionRef.current) {
            stopControls(scannerControls)
            return
          }
          if (result) completeScan(result.getText(), scannerControls)
        },
      )
      if (session !== sessionRef.current) {
        stopControls(controls)
        return
      }
      if (handledRef.current) stopControls(controls)
      else {
        controlsRef.current = controls
        setCameraState('active')
      }
    } catch (error) {
      if (session === sessionRef.current) setCameraState(cameraDenied(error) ? 'denied' : 'error')
    }
  }

  function cancelCamera() {
    sessionRef.current += 1
    stopCamera()
    setCameraState('idle')
  }

  function submitManualCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (manualCode.trim()) completeScan(manualCode)
  }

  return <section className="qr-scanner" aria-label="Scan inventory label">
    <div className="qr-camera-panel">
      <video ref={videoRef} className={`qr-camera-preview${cameraState === 'active' ? ' active' : ''}`} muted playsInline aria-label="Camera preview" />
      {cameraState === 'idle' ? <><span className="qr-scan-mark" aria-hidden="true">⌗</span><p>Scan a costume label to open its inventory record.</p><button type="button" className="button" onClick={() => void startCamera()}>Start camera</button></> : null}
      {cameraState === 'starting' ? <><p role="status">Starting camera…</p><button type="button" className="button button-secondary" onClick={cancelCamera}>Cancel camera</button></> : null}
      {cameraState === 'active' ? <><p role="status">Camera is ready. Point it at a QR label.</p><button type="button" className="button button-secondary" onClick={cancelCamera}>Cancel camera</button></> : null}
      {cameraState === 'denied' ? <><p role="alert">Camera access was denied. Enter the inventory code instead.</p><button type="button" className="button button-secondary" onClick={() => void startCamera()}>Try camera again</button></> : null}
      {cameraState === 'error' ? <p role="alert">Unable to start the camera. Enter the inventory code instead.</p> : null}
    </div>
    <div className="qr-manual-divider"><span>or</span></div>
    <form className="qr-manual-form" onSubmit={submitManualCode}>
      <label htmlFor="manual-inventory-code">{manualLabel}</label>
      <input id="manual-inventory-code" value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="YP-S04-BL" autoCapitalize="characters" />
      <button className="button button-secondary" type="submit">{submitLabel}</button>
    </form>
  </section>
}
