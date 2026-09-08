import { reactive, readonly } from 'vue'
import api from './axios'

const TOKEN_KEY = 'auth_token'

export interface AuthUser {
  id: string | number
  name?: string
  full_name?: string
  display_name?: string
  username?: string
  email?: string
  apps?: string[]
  [key: string]: unknown
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isReady: boolean
}

const state = reactive<AuthState>({
  user: null,
  isLoading: false,
  isReady: false,
})

export const authState = readonly(state)

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      state.user = null
    }
    return Promise.reject(error)
  },
)

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  state.isLoading = true
  try {
    const { data } = await api.get('/auth/me')
    state.user = data?.data ?? null
    return state.user
  } catch (err) {
    state.user = null
    throw err
  } finally {
    state.isLoading = false
    state.isReady = true
  }
}

export function logout(): void {
  clearToken()
  state.user = null
  state.isReady = false
}

export function getDisplayName(user: AuthUser | null = state.user): string {
  if (!user) return 'Guest'
  return (
    user.name ||
    user.full_name ||
    user.display_name ||
    user.username ||
    user.email ||
    'Guest'
  )
}

export function getDisplayEmail(user: AuthUser | null = state.user): string {
  if (!user) return ''
  return user.email || user.username || ''
}
