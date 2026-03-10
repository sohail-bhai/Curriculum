/**
 * Zustand authentication store.
 * Manages user session state across the app.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { authAPI } from '@/lib/api'

export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  full_name: string
  role: 'FACULTY' | 'HOD' | 'ACADEMIC' | 'BOS' | 'DEAN' | 'ADMIN'
  department: number | null
  department_name: string | null
  department_code: string | null
  designation: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.login(email, password)
          const { access, refresh, user } = response.data

          Cookies.set('access_token', access, { expires: 1 / 3, sameSite: 'strict' })
          Cookies.set('refresh_token', refresh, { expires: 7, sameSite: 'strict' })

          set({ user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          const refresh = Cookies.get('refresh_token')
          if (refresh) await authAPI.logout(refresh)
        } catch (_) {}
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        set({ user: null, isAuthenticated: false })
      },

      refreshUser: async () => {
        try {
          const response = await authAPI.me()
          set({ user: response.data, isAuthenticated: true })
        } catch (_) {
          set({ user: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'curriculum-os-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

// Role check helpers
export const useIsFaculty = () => useAuthStore(s => s.user?.role === 'FACULTY')
export const useIsHOD = () => useAuthStore(s => s.user?.role === 'HOD')
export const useIsHODOrAbove = () =>
  useAuthStore(s => ['HOD', 'ACADEMIC', 'BOS', 'DEAN', 'ADMIN'].includes(s.user?.role || ''))
