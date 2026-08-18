export default function LifecycleBadge({ status }: { status: string }) {
  const label = status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
  return <span className={`lifecycle-badge lifecycle-${status.toLowerCase()}`}>{label}</span>
}
