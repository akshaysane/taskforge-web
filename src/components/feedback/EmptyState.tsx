interface EmptyStateProps {
  title: string
  description?: string
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="empty-state" aria-label={title}>
      <span className="empty-state-mark" aria-hidden="true">◇</span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </section>
  )
}
