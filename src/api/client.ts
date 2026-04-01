import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth-storage')
  if (stored) {
    try {
      const { state } = JSON.parse(stored)
      if (state?.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`
      }
    } catch {
      // ignore parse errors
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      const stored = localStorage.getItem('auth-storage')
      if (stored) {
        try {
          const { state } = JSON.parse(stored)
          if (state?.refreshToken) {
            const { data } = await axios.post(
              `${apiClient.defaults.baseURL}/api/auth/refresh`,
              { refreshToken: state.refreshToken },
            )

            const parsed = JSON.parse(stored)
            parsed.state.accessToken = data.accessToken
            parsed.state.refreshToken = data.refreshToken
            localStorage.setItem('auth-storage', JSON.stringify(parsed))

            original.headers.Authorization = `Bearer ${data.accessToken}`
            return apiClient(original)
          }
        } catch {
          localStorage.removeItem('auth-storage')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
