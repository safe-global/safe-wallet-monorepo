import type { listenerMiddlewareInstance, RootState } from '@/store/index'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'

type AuthPayload = {
  sessionExpiresAt: number | null
  lastUsedSpace: string | null
  isStoreHydrated: boolean
  isEmailLoginPending: boolean
}

const initialState: AuthPayload = {
  sessionExpiresAt: null,
  lastUsedSpace: null,
  isStoreHydrated: false,
  isEmailLoginPending: false,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, { payload }: PayloadAction<AuthPayload['sessionExpiresAt']>) => {
      state.sessionExpiresAt = payload
    },

    setUnauthenticated: (state) => {
      state.sessionExpiresAt = null
    },

    setLastUsedSpace: (state, { payload }: PayloadAction<AuthPayload['lastUsedSpace']>) => {
      state.lastUsedSpace = payload
    },

    setIsEmailLoginPending: (state, { payload }: PayloadAction<boolean>) => {
      state.isEmailLoginPending = payload
    },
  },
})

export const { setAuthenticated, setUnauthenticated, setLastUsedSpace, setIsEmailLoginPending } = authSlice.actions

export const isAuthenticated = (state: RootState): boolean => {
  return !!state.auth.sessionExpiresAt && state.auth.sessionExpiresAt > Date.now()
}

export const lastUsedSpace = (state: RootState) => {
  return state.auth.lastUsedSpace
}

export const selectIsStoreHydrated = (state: RootState): boolean => {
  return state.auth.isStoreHydrated
}

export const selectIsEmailLoginPending = (state: RootState): boolean => {
  return state.auth.isEmailLoginPending
}

export const authListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    actionCreator: authSlice.actions.setUnauthenticated,
    effect: (_action, { dispatch }) => {
      // @ts-ignore TS2322: Type string is not assignable to type FullTagDescription<never>
      dispatch(cgwClient.util.invalidateTags(['spaces', 'users']))
    },
  })
}
