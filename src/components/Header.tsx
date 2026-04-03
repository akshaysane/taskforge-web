import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { logoutUser } from '../api/auth'

export default function Header() {
  const navigate = useNavigate()
  const refreshToken = useAuthStore((s) => s.refreshToken)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = async () => {
    if (refreshToken) {
      try { await logoutUser(refreshToken) } catch {}
    }
    logout()
    navigate('/', { replace: true })
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-accent">🏠 Happy Habits</h1>
        <div className="flex items-center gap-3">
          {user?.role === 'parent' && (
            <button
              onClick={() => navigate('/settings')}
              className="text-lg hover:scale-110 transition-transform"
              title="Settings"
            >
              ⚙️
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 font-semibold transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  )
}
