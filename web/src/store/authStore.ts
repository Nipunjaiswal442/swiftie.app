import { create } from 'zustand'
import type { UserProfile } from '../api'

interface AuthState {
  user: UserProfile | null
  token: string | null
  loading: boolean
  setUser: (user: UserProfile | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('swiftie_jwt'),
  loading: true,

  setUser: (user) => set({ user }),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('swiftie_jwt', token)
    } else {
      localStorage.removeItem('swiftie_jwt')
    }
    set({ token })
  },

  setLoading: (loading) => set({ loading }),

  logout: () => {
    localStorage.removeItem('swiftie_jwt')
    set({ user: null, token: null })
  },
}))
