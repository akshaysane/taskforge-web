import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { logoutUser } from '../api/auth'

export default function Home() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await logoutUser(refreshToken)
      } catch {
        // logout anyway even if API call fails
      }
    }
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-accent">TaskForge</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 font-semibold transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-extrabold text-accent mb-2">
            Welcome, {user?.name || 'User'}!
          </h2>
          <p className="text-gray-500 mb-4">
            Role: <span className="font-semibold capitalize">{user?.role}</span>
            {user?.familyId ? ' · Family connected' : ' · No family yet'}
          </p>
          <div className="mt-8 text-3xl flex justify-center gap-2">
            <span>🧹</span><span>⭐</span><span>🎁</span><span>📊</span>
          </div>
          <p className="text-gray-400 text-sm mt-4">Dashboard coming soon...</p>
        </div>
      </main>
    </div>
  )
}
