import type { listenerMiddlewareInstance, RootState } from '@/store/index'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as usersApi } from '@safe-global/store/gateway/AUTO_GENERATED/users'

type AuthPayload = {
  sessionExpiresAt: number | null
  lastUsedSpace: string | null
  isStoreHydrated: boolean
  isOidcLoginPending: boolean
}

const initialState: AuthPayload = {
  sessionExpiresAt: null,
  lastUsedSpace: null,
  isStoreHydrated: false,
  isOidcLoginPending: false,
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

    setIsOidcLoginPending: (state, { payload }: PayloadAction<boolean>) => {
      state.isOidcLoginPending = payload
    },
  },
})

export const { setAuthenticated, setUnauthenticated, setLastUsedSpace, setIsOidcLoginPending } = authSlice.actions

export const isAuthenticated = (state: RootState): boolean => {
  return !!state.auth.sessionExpiresAt && state.auth.sessionExpiresAt > Date.now()
}

export const lastUsedSpace = (state: RootState) => {
  return state.auth.lastUsedSpace
}

export const selectIsStoreHydrated = (state: RootState): boolean => {
  return state.auth.isStoreHydrated
}

export const selectIsOidcLoginPending = (state: RootState): boolean => {
  return state.auth.isOidcLoginPending
}

export const authListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    actionCreator: authSlice.actions.setUnauthenticated,
    effect: (_action, { dispatch }) => {
      dispatch(spacesApi.util.invalidateTags(['spaces']))
      dispatch(usersApi.util.invalidateTags(['users']))
    },
  })
}
