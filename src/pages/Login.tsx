import { AxiosError } from 'axios'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../api/auth'
import ErrorBanner from '../components/feedback/ErrorBanner'
import { useAuthStore } from '../store/auth'

export default function Login() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setError(null)
    setIsSubmitting(true)

    try {
      const session = await loginUser({
        username: String(formData.get('username') ?? ''),
        password: String(formData.get('password') ?? ''),
      })
      setSession(session.accessToken, session.user)
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError instanceof AxiosError && requestError.response?.status === 401
        ? 'Invalid username or password.'
        : 'Unable to sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand" aria-label="SR Natiya Dance Shop">
        <div className="login-ornament" aria-hidden="true" />
        <div className="login-brand-copy">
          <span>SR Natiya</span>
          <small>Dance Shop</small>
        </div>
      </section>
      <section className="login-form-panel" aria-labelledby="login-title">
        <div className="mobile-login-brand" aria-hidden="true">
          <span>SR Natiya</span>
          <small>Dance Shop</small>
        </div>
        <h1 id="login-title">Welcome back</h1>
        <p>Sign in to manage costume inventory.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="username">Username</label>
          <input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck="false" required />
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required />
          {error ? <ErrorBanner message={error} /> : null}
          <button className="button login-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in' : 'Sign in'}
          </button>
        </form>
        <small className="login-access-note">Administrator access only.</small>
      </section>
    </main>
  )
}
