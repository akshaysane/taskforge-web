import { useEffect, useId, useRef, type ReactNode } from 'react'

interface AccessibleSheetProps {
  label: string
  onRequestClose: () => void
  children: ReactNode
  className?: string
}

const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function AccessibleSheet({ label, onRequestClose, children, className = 'editor-sheet' }: AccessibleSheetProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const closeRef = useRef(onRequestClose)
  const titleId = useId()

  useEffect(() => { closeRef.current = onRequestClose }, [onRequestClose])

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const initial = dialog?.querySelector<HTMLElement>('[data-initial-focus]') ?? dialog?.querySelector<HTMLElement>(focusableSelector)
    initial?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); return }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)]
      if (focusable.length === 0) { event.preventDefault(); return }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => { document.removeEventListener('keydown', handleKeyDown); previousFocus.current?.focus() }
  }, [])

  return <div className="drawer-backdrop"><section ref={dialogRef} className={className} role="dialog" aria-modal="true" aria-label={label} aria-labelledby={titleId}>
    <span id={titleId} className="sr-only">{label}</span>{children}
  </section></div>
}
