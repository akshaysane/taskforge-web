import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import AppShell from './components/app/AppShell'
import LoadingState from './components/feedback/LoadingState'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Designs from './pages/Designs'
import DesignDetail from './pages/DesignDetail'
import InventorySettings from './pages/InventorySettings'
import Login from './pages/Login'
import { useAuthStore } from './store/auth'

const Scan = lazy(() => import('./pages/Scan'))
const OriginalSets = lazy(() => import('./pages/OriginalSets'))
const OriginalSetOnboarding = lazy(() => import('./pages/OriginalSetOnboarding'))

function PublicOnlyRoute() {
  const status = useAuthStore((state) => state.status)
  if (status === 'loading') return <LoadingState label="Loading inventory" />
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function RoutePlaceholder({ title }: { title: string }) {
  return <div className="route-placeholder"><h1>{title}</h1></div>
}

function InventoryItemPlaceholder() {
  const location = useLocation()
  const verification = (location.state as { labelVerification?: string } | null)?.labelVerification
  return <div className="route-placeholder"><h1>Inventory item</h1>{verification ? <p role="status">{verification}</p> : null}</div>
}

export default function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<RoutePlaceholder title="Inventory" />} />
            <Route path="/scan" element={<Suspense fallback={<LoadingState label="Loading scanner" />}><Scan /></Suspense>} />
            <Route path="/inventory/:inventoryCode" element={<InventoryItemPlaceholder />} />
            <Route path="/onboarding" element={<Navigate to="/original-sets" replace />} />
            <Route path="/original-sets" element={<Suspense fallback={<LoadingState label="Loading original sets" />}><OriginalSets /></Suspense>} />
            <Route path="/original-sets/:originalSetId" element={<Suspense fallback={<LoadingState label="Loading original set" />}><OriginalSetOnboarding /></Suspense>} />
            <Route path="/designs" element={<Designs />} />
            <Route path="/designs/:designId" element={<DesignDetail />} />
            <Route path="/configuration" element={<InventorySettings />} />
            <Route path="/administrators" element={<RoutePlaceholder title="Administrators" />} />
            <Route path="/more" element={<RoutePlaceholder title="More" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
