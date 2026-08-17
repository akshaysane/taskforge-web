interface NavIconProps {
  name: 'dashboard' | 'inventory' | 'scan' | 'more'
}

export default function NavIcon({ name }: NavIconProps) {
  if (name === 'dashboard') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9 21v-6h6v6" /></svg>
  }
  if (name === 'inventory') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 6 9-4 9 4-9 4zM3 6v12l9 4 9-4V6M12 10v12" /></svg>
  }
  if (name === 'scan') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3m8 0h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 8v8m3-8v8m3-8v8m3-8v8" /></svg>
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></svg>
}
