import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  actions?: ReactNode
}

export default function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <h1>{title}</h1>
      <div className="page-header-actions">{actions}</div>
    </header>
  )
}
