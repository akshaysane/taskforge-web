import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import LoadingState from './feedback/LoadingState'

export default function ProtectedRoute() {
  const status = useAuthStore((state) => state.status)

  if (status === 'loading') return <LoadingState label="Loading inventory" />
  if (status === 'anonymous') return <Navigate to="/login" replace />

  return <Outlet />
}
