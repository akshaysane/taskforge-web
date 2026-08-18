import PageHeader from '../components/app/PageHeader'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getInventorySummary, type InventorySummary } from '../api/dashboard'
import { apiError } from '../api/designs'
import LoadingState from '../components/feedback/LoadingState'
import ErrorBanner from '../components/feedback/ErrorBanner'

export default function Dashboard() {
  const [summary, setSummary] = useState<InventorySummary | null>(null); const [error, setError] = useState('')
  useEffect(() => { let active = true; void getInventorySummary().then((next) => active && setSummary(next)).catch((reason) => active && setError(apiError(reason).message)); return () => { active = false } }, [])
  return <><PageHeader title="Inventory Dashboard" actions={<><Link className="button button-secondary" to="/scan">Scan item</Link><Link className="button" to="/inventory/new">Add inventory</Link></>} /><section className="dashboard-overview"><h2>Inventory overview</h2>{error ? <ErrorBanner message={error} /> : !summary ? <LoadingState label="Loading inventory overview" /> : <><div className="dashboard-metrics"><Link to="/inventory"><b>{summary.total}</b><span>Total inventory</span></Link><Link to="/inventory?availability=AVAILABLE"><b>{summary.available}</b><span>{summary.available} available</span></Link><Link to="/inventory?lifecycleStatus=CLEANING"><b>{summary.cleaning}</b><span>Cleaning</span></Link><Link to="/inventory?lifecycleStatus=REPAIR_REQUIRED"><b>{summary.repairRequired}</b><span>Repair required</span></Link><Link to="/inventory?lifecycleStatus=ALTERATION_REQUIRED"><b>{summary.alterationRequired}</b><span>Alteration required</span></Link><Link to="/inventory?lifecycleStatus=MISSING"><b>{summary.missing}</b><span>Missing</span></Link></div><Link className="onboarding-attention" to="/original-sets"><strong>{summary.originalSets.incomplete} original sets need onboarding</strong><span>{summary.originalSets.verified} of {summary.originalSets.total} verified</span></Link></>}</section></>
}
