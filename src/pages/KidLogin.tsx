import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { loginPin } from '../api/auth'
import { useAuthStore } from '../store/auth'
import { AxiosError } from 'axios'

export default function KidLogin() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [familyName, setFamilyName] = useState('')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!familyName.trim()) {
      setError('Family name is required')
      return
    }
    if (!name.trim()) {
      setError('Your name is required')
      return
    }
    if (!/^[0-9]{4,6}$/.test(pin)) {
      setError('PIN must be 4-6 digits')
      return
    }

    setLoading(true)
    try {
      const result = await loginPin({
        familyName: familyName.trim(),
        name: name.trim(),
        pin,
      })
      login(result.accessToken, result.refreshToken, result.user)
      navigate('/home', { replace: true })
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 401) {
        setError('Family name, name, or PIN is incorrect')
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
        <div className="text-5xl mb-2">👧👦</div>
        <h1 className="text-2xl font-extrabold text-accent">Kid Login</h1>
        <p className="text-gray-500 text-sm">Ask your parent for your PIN!</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Family Name"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          required
          className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="password"
          inputMode="numeric"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          required
          className="w-full bg-surface rounded-xl px-4 py-3 text-sm text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary"
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
        Are you a parent?{' '}
        <Link to="/login" className="text-accent font-semibold hover:underline">
          Parent Login
        </Link>
      </p>
    </Layout>
  )
}
