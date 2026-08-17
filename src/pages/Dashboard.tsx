import EmptyState from '../components/feedback/EmptyState'
import PageHeader from '../components/app/PageHeader'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <>
      <PageHeader
        title="Inventory Dashboard"
        actions={(
          <>
            <label className="search-field">
              <span className="sr-only">Search inventory</span>
              <input type="search" placeholder="Search inventory" />
            </label>
            <Link className="button button-secondary" to="/scan">Scan item</Link>
            <Link className="button" to="/inventory">Add inventory</Link>
          </>
        )}
      />
      <section className="dashboard-overview">
        <h2>Inventory overview</h2>
        <EmptyState title="Inventory Dashboard" />
      </section>
    </>
  )
}
