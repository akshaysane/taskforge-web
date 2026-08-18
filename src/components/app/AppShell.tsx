import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import MobileNav from './MobileNav'
import NavIcon from './NavIcon'

const navItems = [
  ['Dashboard', '/dashboard', 'dashboard'],
  ['Inventory', '/inventory', 'inventory'],
  ['Scan', '/scan', 'scan'],
  ['Onboarding', '/original-sets', 'more'],
  ['Designs', '/designs', 'inventory'],
  ['Configuration', '/configuration', 'more'],
  ['Administrators', '/administrators', 'more'],
] as const

export default function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <a className="brand-lockup" href="/dashboard" aria-label="SR Natiya Dance Shop home">
          <span>SR Natiya</span>
          <small>Dance Shop</small>
        </a>
        <div className="ornament" aria-hidden="true" />
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navItems.map(([label, to, icon]) => (
            <NavLink key={to} to={to}>
              <NavIcon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="app-content">
        <header className="mobile-brand">
          <a className="brand-lockup" href="/dashboard" aria-label="SR Natiya Dance Shop home">
            <span>SR Natiya</span>
            <small>Dance Shop</small>
          </a>
          <button type="button" className="mobile-menu" aria-label="Open navigation menu" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>☰</button>
        </header>
        {mobileMenuOpen ? <nav className="mobile-menu-panel" aria-label="More navigation">{navItems.filter(([label]) => !['Dashboard', 'Inventory', 'Scan', 'Onboarding'].includes(label)).map(([label, to]) => <NavLink key={to} to={to} onClick={() => setMobileMenuOpen(false)}>{label}</NavLink>)}</nav> : null}
        <main><Outlet /></main>
      </div>
      <MobileNav />
    </div>
  )
}
