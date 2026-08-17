import axios, { type InternalAxiosRequestConfig } from 'axios'
import { refreshSession } from './auth'
import { useAuthStore } from '../store/auth'

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise: Promise<string> | null = null

async function getRefreshedAccessToken(): Promise<string> {
  refreshPromise ??= refreshSession()
    .then(({ accessToken, user }) => {
      useAuthStore.getState().setSession(accessToken, user)
      return accessToken
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig | undefined
    const isAuthenticationRequest = /\/api\/auth\/(login|refresh)/.test(original?.url ?? '')

    if (error.response?.status !== 401 || !original || original._retry || isAuthenticationRequest) {
      return Promise.reject(error)
    }

    original._retry = true
    try {
      const accessToken = await getRefreshedAccessToken()
      original.headers.Authorization = `Bearer ${accessToken}`
      return apiClient(original)
    } catch (refreshError) {
      useAuthStore.getState().clearSession()
      return Promise.reject(refreshError)
    }
  },
)

export default apiClient
