import { NavLink, Outlet } from 'react-router-dom'
import MobileNav from './MobileNav'
import NavIcon from './NavIcon'

const navItems = [
  ['Dashboard', '/dashboard', 'dashboard'],
  ['Inventory', '/inventory', 'inventory'],
  ['Scan', '/scan', 'scan'],
  ['Onboarding', '/onboarding', 'more'],
  ['Designs', '/designs', 'inventory'],
  ['Configuration', '/configuration', 'more'],
  ['Administrators', '/administrators', 'more'],
] as const

export default function AppShell() {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <a className="brand-lockup" href="/dashboard" aria-label="RasikaPriya Dance Shop home">
          <span>RasikaPriya</span>
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
          <a className="brand-lockup" href="/dashboard" aria-label="RasikaPriya Dance Shop home">
            <span>RasikaPriya</span>
            <small>Dance Shop</small>
          </a>
          <span className="mobile-menu" aria-hidden="true">☰</span>
        </header>
        <main><Outlet /></main>
      </div>
      <MobileNav />
    </div>
  )
}
