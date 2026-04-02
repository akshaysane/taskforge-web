import type { ChoreTemplate } from '../api/chores'

interface TemplateListProps {
  templates: ChoreTemplate[]
  loading: boolean
  onEdit: (template: ChoreTemplate) => void
  onDelete: (templateId: string) => void
  onNew: () => void
}

export default function TemplateList({ templates, loading, onEdit, onDelete, onNew }: TemplateListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-10 bg-gray-100 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-accent">📋 Templates</h3>
        <button onClick={onNew}
          className="bg-primary hover:bg-primary-dark text-white text-xs font-bold py-1.5 px-4 rounded-full transition-colors">
          + New
        </button>
      </div>
      {templates.length === 0 ? (
        <p className="text-gray-400 text-sm">No templates yet — create one to get started</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span>{t.icon || '📝'}</span>
                <span className="font-semibold text-sm">{t.name}</span>
                <span className="text-primary text-xs font-bold">{t.points}pts</span>
                {t.requiresApproval && <span className="text-orange-400 text-xs">✓ approval</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(t)} className="text-sm hover:scale-110 transition-transform" title="Edit">✏️</button>
                <button onClick={() => onDelete(t.id)} className="text-sm hover:scale-110 transition-transform" title="Delete">🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
