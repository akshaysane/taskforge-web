import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthUser {
  id: string
  name: string
  role: string
  familyId: string | null
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void
  logout: () => void
  setFamilyId: (familyId: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      login: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user, isAuthenticated: true }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
      setFamilyId: (familyId) =>
        set((state) => ({
          user: state.user ? { ...state.user, familyId } : null,
        })),
    }),
    { name: 'auth-storage' },
  ),
)
