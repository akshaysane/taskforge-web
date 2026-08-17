import { create } from 'zustand'
import { refreshSession } from '../api/auth'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'ADMIN'
}

export interface AuthState {
  status: 'loading' | 'authenticated' | 'anonymous'
  accessToken: string | null
  user: AdminUser | null
  setSession: (accessToken: string, user: AdminUser) => void
  clearSession: () => void
  bootstrap: () => Promise<void>
}

let bootstrapPromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  accessToken: null,
  user: null,
  setSession: (accessToken, user) => set({ accessToken, user, status: 'authenticated' }),
  clearSession: () => set({ accessToken: null, user: null, status: 'anonymous' }),
  bootstrap: async () => {
    bootstrapPromise ??= refreshSession()
      .then(({ accessToken, user }) => set({ accessToken, user, status: 'authenticated' }))
      .catch(() => set({ accessToken: null, user: null, status: 'anonymous' }))
      .finally(() => {
        bootstrapPromise = null
      })

    return bootstrapPromise
  },
}))
