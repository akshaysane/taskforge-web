import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function PublicRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return <Outlet />
}
