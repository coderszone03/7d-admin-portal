import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { getCookie } from '../../lib/utils/cookies'
import { AUTH_COOKIE_KEY } from './constants'

type AuthUser = {
  email: string
  name?: string
  token?: string
}

type AuthState = {
  isAuthenticated: boolean
  user: AuthUser | null
}

const createEmptyState = (): AuthState => ({
  isAuthenticated: false,
  user: null,
})

const loadPersistedState = (): AuthState => {
  const raw = getCookie(AUTH_COOKIE_KEY)

  if (!raw) {
    return createEmptyState()
  }

  try {
    const parsed = JSON.parse(raw) as AuthUser

    if (parsed?.email) {
      return {
        isAuthenticated: true,
        user: parsed,
      }
    }
  } catch {
    // Ignore malformed cookie data and fall back to an empty state.
  }

  return createEmptyState()
}

const initialState: AuthState = loadPersistedState()

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<AuthUser>) => {
      state.isAuthenticated = true
      state.user = action.payload
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
    },
  },
})

export const { loginSuccess, logout } = authSlice.actions

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectCurrentUser = (state: RootState) => state.auth.user

export default authSlice.reducer
