import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiError, listDesigns, type Design } from '../api/designs'
import PageHeader from '../components/app/PageHeader'
import ErrorBanner from '../components/feedback/ErrorBanner'
import LoadingState from '../components/feedback/LoadingState'
import DesignDetail from './DesignDetail'

export default function Designs() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [filter, setFilter] = useState<'active' | 'archived'>('active')
  const [editing, setEditing] = useState<Design | 'new' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void listDesigns().then((loaded) => { if (active) setDesigns(loaded) }).catch((requestError: unknown) => { if (active) setError(apiError(requestError).message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const visibleDesigns = designs.filter((design) => filter === 'active' ? !design.archivedAt : Boolean(design.archivedAt))
  const saveDesign = (saved: Design) => setDesigns((current) => current.some((design) => design.id === saved.id) ? current.map((design) => design.id === saved.id ? saved : design) : [...current, saved])

  if (loading) return <LoadingState label="Loading designs" />
  return <><PageHeader title="Designs" actions={<button className="button" onClick={() => setEditing('new')}>Add design</button>} />
    <section className="config-page designs-page"><div className="page-intro"><p>Manage Bharatanatyam costume designs.</p><div className="filter-tabs"><button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Active</button><button className={filter === 'archived' ? 'active' : ''} onClick={() => setFilter('archived')}>Archived</button></div></div>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="data-table designs-table"><div className="table-header"><span>Code</span><span>Name</span><span>Costume type</span><span>Colors</span><span>Required pieces</span><span>Original sets</span><span>Actions</span></div>
        {visibleDesigns.map((design) => <article key={design.id} className="table-row"><strong>{design.designCode}</strong><span>{design.name}</span><span>{design.costumeType}</span><span className="color-swatches" aria-label={`${design.primaryColor ?? ''} ${design.secondaryColor ?? ''}`}><i style={{ background: design.primaryColor ?? '#ded8d4' }} /><i style={{ background: design.secondaryColor ?? '#ded8d4' }} /></span><span>{design.pieceRequirements.map((requirement) => requirement.pieceType?.name).filter(Boolean).join(', ') || 'No pieces configured'}</span><span>0 original sets</span><Link className="icon-button" aria-label={`Edit ${design.name}`} to={`/designs/${design.id}`}>Edit</Link></article>)}
        {visibleDesigns.length === 0 ? <p className="empty-table">No {filter} designs yet.</p> : null}</div>
    </section>
    {editing ? <div className="drawer-backdrop"><DesignDetail designId={editing === 'new' ? undefined : editing.id} onSaved={(saved) => { saveDesign(saved); setEditing(null) }} onClose={() => setEditing(null)} /></div> : null}
  </>
}
