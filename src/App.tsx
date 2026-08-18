import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, createRoutesFromElements, Navigate, Outlet, Route, RouterProvider } from 'react-router-dom'
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
const InventoryList = lazy(() => import('./pages/InventoryList'))
const InventoryCreate = lazy(() => import('./pages/InventoryCreate'))
const InventoryDetail = lazy(() => import('./pages/InventoryDetail'))
const AdminSettings = lazy(() => import('./pages/AdminSettings'))

function PublicOnlyRoute() {
  const status = useAuthStore((state) => state.status)
  if (status === 'loading') return <LoadingState label="Loading inventory" />
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />
  return <Outlet />
}


function AppBootstrap() {
  const bootstrap = useAuthStore((state) => state.bootstrap)

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  return <Outlet />
}

const router = createBrowserRouter(createRoutesFromElements(<Route element={<AppBootstrap />}>
  <Route element={<PublicOnlyRoute />}><Route path="/login" element={<Login />} /></Route>
  <Route element={<ProtectedRoute />}><Route element={<AppShell />}>
    <Route path="/dashboard" element={<Dashboard />} /><Route path="/inventory" element={<Suspense fallback={<LoadingState label="Loading inventory" />}><InventoryList /></Suspense>} /><Route path="/inventory/new" element={<Suspense fallback={<LoadingState label="Loading inventory editor" />}><InventoryCreate /></Suspense>} />
    <Route path="/scan" element={<Suspense fallback={<LoadingState label="Loading scanner" />}><Scan /></Suspense>} /><Route path="/inventory/:inventoryCode" element={<Suspense fallback={<LoadingState label="Loading inventory item" />}><InventoryDetail /></Suspense>} />
    <Route path="/onboarding" element={<Navigate to="/original-sets" replace />} /><Route path="/original-sets" element={<Suspense fallback={<LoadingState label="Loading original sets" />}><OriginalSets /></Suspense>} />
    <Route path="/original-sets/:originalSetId" element={<Suspense fallback={<LoadingState label="Loading original set" />}><OriginalSetOnboarding /></Suspense>} />
    <Route path="/designs" element={<Designs />} /><Route path="/designs/:designId" element={<DesignDetail />} /><Route path="/configuration" element={<InventorySettings />} />
    <Route path="/administrators" element={<Suspense fallback={<LoadingState label="Loading administrators" />}><AdminSettings /></Suspense>} /><Route path="/more" element={<Navigate to="/original-sets" replace />} />
  </Route></Route><Route path="*" element={<Navigate to="/dashboard" replace />} />
</Route>))

export default function App() { return <RouterProvider router={router} /> }
