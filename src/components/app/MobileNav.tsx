import { NavLink } from 'react-router-dom'
import NavIcon from './NavIcon'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/inventory', label: 'Inventory', icon: 'inventory' },
  { to: '/scan', label: 'Scan', icon: 'scan' },
  { to: '/more', label: 'More', icon: 'more' },
] as const

export default function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Primary navigation">
      {navItems.map(({ to, label, icon }) => (
        <NavLink key={to} to={to} className="mobile-nav-link">
          <NavIcon name={icon} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
