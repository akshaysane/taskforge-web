import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { registerUser } from '../api/auth'
import { AxiosError } from 'axios'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await registerUser({ name, email, password })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 409) {
        setError('Email already registered')
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
        <div className="text-4xl mb-2">📋✨</div>
        <h1 className="text-2xl font-extrabold text-accent">Create Your Account</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full bg-surface rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold py-3 rounded-full text-lg transition-colors"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-accent font-semibold hover:underline">
          Log In
        </Link>
      </p>
    </Layout>
  )
}
