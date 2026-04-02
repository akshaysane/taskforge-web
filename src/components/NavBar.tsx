import { useLocation, useNavigate } from 'react-router-dom'

const tabs = [
  { label: 'Home', path: '/home', icon: '🏠' },
  { label: 'Chores', path: '/chores', icon: '📋' },
  { label: 'Rewards', path: '/rewards', icon: '🎁' },
]

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="max-w-4xl mx-auto px-4 mt-4 mb-2">
      <div className="flex bg-gray-100 rounded-2xl p-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => !tab.disabled && navigate(tab.path)}
              disabled={tab.disabled}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-accent text-white shadow-sm'
                  : tab.disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
