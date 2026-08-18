import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import QrScanner from './QrScanner'

const scan = vi.fn()
const stop = vi.fn()

function loadReader() {
  return Promise.resolve(class {
    decodeFromConstraints = scan
  })
}

beforeEach(() => {
  scan.mockReset()
  stop.mockReset()
})

test('delivers one callback and stops the scanner after a successful result', async () => {
  const controls = { stop }
  scan.mockImplementationOnce(async (_constraints, _video, callback) => {
    callback({ getText: () => 'YP-S04-BL' }, undefined, controls)
    callback({ getText: () => 'YP-S04-BL' }, undefined, controls)
    return controls
  })
  const onScan = vi.fn()
  const user = userEvent.setup()
  render(<QrScanner onScan={onScan} loadReader={loadReader} />)

  await user.click(screen.getByRole('button', { name: /start camera/i }))

  await screen.findByRole('button', { name: /find item/i })
  expect(onScan).toHaveBeenCalledTimes(1)
  expect(onScan).toHaveBeenCalledWith('YP-S04-BL')
  expect(stop).toHaveBeenCalledTimes(1)
})

test('stops an active scanner when the operator cancels', async () => {
  scan.mockResolvedValueOnce({ stop })
  const user = userEvent.setup()
  render(<QrScanner onScan={vi.fn()} loadReader={loadReader} />)

  await user.click(screen.getByRole('button', { name: /start camera/i }))
  await user.click(await screen.findByRole('button', { name: /cancel camera/i }))

  expect(stop).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: /start camera/i })).toBeVisible()
})

test('stops an active scanner when the scan route unmounts', async () => {
  scan.mockResolvedValueOnce({ stop })
  const user = userEvent.setup()
  const view = render(<QrScanner onScan={vi.fn()} loadReader={loadReader} />)

  await user.click(screen.getByRole('button', { name: /start camera/i }))
  await screen.findByRole('button', { name: /cancel camera/i })
  view.unmount()

  expect(stop).toHaveBeenCalledTimes(1)
})

test('does not start a delayed camera after cancellation', async () => {
  let resolveReader: ((reader: ReturnType<typeof loadReader> extends Promise<infer Reader> ? Reader : never) => void) | undefined
  const delayedReader = new Promise<ReturnType<typeof loadReader> extends Promise<infer Reader> ? Reader : never>((resolve) => { resolveReader = resolve })
  const user = userEvent.setup()
  render(<QrScanner onScan={vi.fn()} loadReader={() => delayedReader} />)

  await user.click(screen.getByRole('button', { name: /start camera/i }))
  await user.click(screen.getByRole('button', { name: /cancel camera/i }))
  resolveReader?.(class { decodeFromConstraints = scan })
  await Promise.resolve()

  expect(scan).not.toHaveBeenCalled()
})

test('keeps the idle state when a cancelled camera startup later rejects', async () => {
  let rejectReader: ((reason?: unknown) => void) | undefined
  const delayedReader = new Promise<ReturnType<typeof loadReader> extends Promise<infer Reader> ? Reader : never>((_resolve, reject) => { rejectReader = reject })
  const user = userEvent.setup()
  render(<QrScanner onScan={vi.fn()} loadReader={() => delayedReader} />)

  await user.click(screen.getByRole('button', { name: /start camera/i }))
  await user.click(screen.getByRole('button', { name: /cancel camera/i }))
  rejectReader?.(new Error('loader failed'))

  expect(await screen.findByRole('button', { name: /start camera/i })).toBeVisible()
  expect(screen.queryByText(/unable to start the camera/i)).not.toBeInTheDocument()
})

test('shows the manual entry fallback when the camera is denied', async () => {
  scan.mockRejectedValueOnce(new DOMException('Permission denied', 'NotAllowedError'))
  const user = userEvent.setup()
  render(<QrScanner onScan={vi.fn()} loadReader={loadReader} />)

  await user.click(screen.getByRole('button', { name: /start camera/i }))

  expect(await screen.findByText(/camera access was denied/i)).toBeVisible()
  expect(screen.getByLabelText(/enter inventory code/i)).toBeVisible()
})

test('allows another manual attempt when the parent rejects the first code', async () => {
  const onScan = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true)
  const user = userEvent.setup()
  render(<QrScanner onScan={onScan} loadReader={loadReader} />)

  await user.type(screen.getByLabelText(/enter inventory code/i), 'YP-S04-BL')
  await user.click(screen.getByRole('button', { name: /find item/i }))
  await user.click(screen.getByRole('button', { name: /find item/i }))

  expect(onScan).toHaveBeenCalledTimes(2)
})
