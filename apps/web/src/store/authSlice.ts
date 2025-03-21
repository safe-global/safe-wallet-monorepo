import type { listenerMiddlewareInstance, RootState } from '@/store/index'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'

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

export const authListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    actionCreator: authSlice.actions.setUnauthenticated,
    effect: (_action, { dispatch }) => {
      dispatch(cgwClient.util.resetApiState())
    },
  })
}
