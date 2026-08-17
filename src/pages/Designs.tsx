import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiError, archiveDesign, listDesigns, type Design } from '../api/designs'
import PageHeader from '../components/app/PageHeader'
import ErrorBanner from '../components/feedback/ErrorBanner'
import LoadingState from '../components/feedback/LoadingState'
import DesignDetail from './DesignDetail'
import AccessibleSheet from '../components/overlay/AccessibleSheet'

export default function Designs() {
  const [designs, setDesigns] = useState<Design[]>([])
  const [filter, setFilter] = useState<'active' | 'archived'>('active')
  const [editing, setEditing] = useState<Design | 'new' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [archiving, setArchiving] = useState<Design | null>(null)

  useEffect(() => {
    let active = true
    void listDesigns().then((loaded) => { if (active) setDesigns(loaded) }).catch((requestError: unknown) => { if (active) setError(apiError(requestError).message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const visibleDesigns = designs.filter((design) => filter === 'active' ? !design.archivedAt : Boolean(design.archivedAt))
  const saveDesign = (saved: Design) => setDesigns((current) => current.some((design) => design.id === saved.id) ? current.map((design) => design.id === saved.id ? saved : design) : [...current, saved])
  async function confirmArchive() {
    if (!archiving) return
    setError('')
    try {
      await archiveDesign(archiving.id)
      setDesigns((current) => current.map((design) => design.id === archiving.id ? { ...design, archivedAt: new Date().toISOString() } : design))
      setArchiving(null)
    } catch (requestError) { setError(apiError(requestError).message) }
  }

  if (loading) return <LoadingState label="Loading designs" />
  return <><PageHeader title="Designs" actions={<button className="button" onClick={() => setEditing('new')}>Add design</button>} />
    <section className="config-page designs-page"><div className="page-intro"><p>Manage Bharatanatyam costume designs.</p><div className="filter-tabs"><button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Active</button><button className={filter === 'archived' ? 'active' : ''} onClick={() => setFilter('archived')}>Archived</button></div></div>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="data-table designs-table"><div className="table-header"><span>Code</span><span>Name</span><span>Costume type</span><span>Colors</span><span>Required pieces</span><span>Original sets</span><span>Actions</span></div>
        {visibleDesigns.map((design) => <article key={design.id} className="table-row"><strong>{design.designCode}</strong><span>{design.name}</span><span>{design.costumeType}</span><span className="color-swatches" aria-label={`${design.primaryColor ?? ''} ${design.secondaryColor ?? ''}`}><i style={{ background: design.primaryColor ?? '#ded8d4' }} /><i style={{ background: design.secondaryColor ?? '#ded8d4' }} /></span><span>{design.pieceRequirements.map((requirement) => requirement.pieceType?.name).filter(Boolean).join(', ') || 'No pieces configured'}</span><span>{design.originalSetCount} original sets</span><span className="row-actions"><Link className="icon-button" aria-label={`Edit ${design.name}`} to={`/designs/${design.id}`}>Edit</Link><button className="icon-button" aria-label={`Archive ${design.name}`} onClick={() => setArchiving(design)}>Archive</button></span></article>)}
        {visibleDesigns.length === 0 ? <p className="empty-table">No {filter} designs yet.</p> : null}</div>
    </section>
    {editing ? <DesignDetail designId={editing === 'new' ? undefined : editing.id} onSaved={(saved) => { saveDesign(saved); setEditing(null) }} onClose={() => setEditing(null)} /> : null}
    {archiving ? <AccessibleSheet label="Archive design" className="confirm-dialog" onRequestClose={() => setArchiving(null)}><h2>Archive {archiving.name}?</h2><p>Archived designs are removed from the active catalog.</p><div className="editor-actions"><button className="button button-secondary" onClick={() => setArchiving(null)}>Cancel</button><button className="button" onClick={confirmArchive}>Archive design</button></div></AccessibleSheet> : null}
  </>
}
