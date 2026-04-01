import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { loginUser } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { AxiosError } from 'axios'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const justRegistered = (location.state as { registered?: boolean })?.registered

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await loginUser({ email, password })
      login(result.accessToken, result.refreshToken, result.user)
      navigate('/home', { replace: true })
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        setError('Invalid email or password')
      } else {
        setError('Unable to connect to server')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">👋</div>
        <h1 className="text-2xl font-extrabold text-accent">Welcome Back!</h1>
        <p className="text-gray-500 text-sm">Please sign in to continue</p>
      </div>

      {justRegistered && (
        <div className="bg-green-50 text-primary text-sm font-semibold px-4 py-3 rounded-xl mb-4">
          Account created! Please log in.
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-full text-lg transition-colors"
        >
          {loading ? 'Signing In...' : 'Log In'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-accent font-semibold hover:underline">
          Sign Up
        </Link>
      </p>
    </Layout>
  )
}
