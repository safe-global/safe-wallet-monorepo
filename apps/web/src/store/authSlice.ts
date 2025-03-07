import type { RootState } from '@/store/index'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type AuthPayload = {
  sessionExpiresAt: number | null
}

const initialState: AuthPayload = {
  sessionExpiresAt: null,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, { payload }: PayloadAction<AuthPayload>) => {
      state.sessionExpiresAt = payload.sessionExpiresAt
    },

    setUnauthenticated: (state) => {
      state.sessionExpiresAt = null
    },
  },
})

export const { setAuthenticated, setUnauthenticated } = authSlice.actions

export const isAuthenticated = (state: RootState): boolean => {
  return !!state.auth.sessionExpiresAt && state.auth.sessionExpiresAt > Date.now()
}
