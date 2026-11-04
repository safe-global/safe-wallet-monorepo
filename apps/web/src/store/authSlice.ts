import type { listenerMiddlewareInstance, RootState } from '@/store/index'
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as usersApi } from '@safe-global/store/gateway/AUTO_GENERATED/users'

/** Shared session expiry duration used wherever the FE dispatches setAuthenticated. */
export const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000

type AuthPayload = {
  sessionExpiresAt: number | null
  landingSpaceHint: string | null
  isStoreHydrated: boolean
  cfSafeSynced: boolean
  isOidcLoginPending: boolean
  isSessionCheckPending: boolean
}

const initialState: AuthPayload = {
  sessionExpiresAt: null,
  landingSpaceHint: null,
  isStoreHydrated: false,
  cfSafeSynced: false,
  isOidcLoginPending: false,
  isSessionCheckPending: false,
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, { payload }: PayloadAction<AuthPayload['sessionExpiresAt']>) => {
      state.sessionExpiresAt = payload
      state.isSessionCheckPending = false
    },

    setUnauthenticated: (state) => {
      state.sessionExpiresAt = null
      // Reset so CF sync re-runs on next sign-in
      state.cfSafeSynced = false
      state.isSessionCheckPending = false
    },

    setLandingSpaceHint: (state, { payload }: PayloadAction<AuthPayload['landingSpaceHint']>) => {
      state.landingSpaceHint = payload
    },

    setCfSafeSynced: (state, { payload }: PayloadAction<boolean>) => {
      state.cfSafeSynced = payload
    },

    setIsOidcLoginPending: (state, { payload }: PayloadAction<boolean>) => {
      state.isOidcLoginPending = payload
    },

    setSessionCheckPending: (state, { payload }: PayloadAction<boolean>) => {
      state.isSessionCheckPending = payload
    },
  },
})

export const {
  setAuthenticated,
  setUnauthenticated,
  setLandingSpaceHint,
  setCfSafeSynced,
  setIsOidcLoginPending,
  setSessionCheckPending,
} = authSlice.actions

export const isAuthenticated = (state: RootState): boolean => {
  return !!state.auth.sessionExpiresAt && state.auth.sessionExpiresAt > Date.now()
}

/**
 * The Workspace id last seen in a URL, for the `/spaces` redirect without an id only
 * (useLandingSpaceId). All browser tabs share it, so it cannot tell which Workspace a page is in.
 */
export const selectLandingSpaceHint = (state: RootState): string | null => {
  // State persisted before the rename has no such key
  return state.auth.landingSpaceHint ?? null
}

export const selectIsStoreHydrated = (state: RootState): boolean => {
  return state.auth.isStoreHydrated
}

export const selectCfSafeSynced = (state: RootState): boolean => {
  return state.auth.cfSafeSynced
}

export const selectIsOidcLoginPending = (state: RootState): boolean => {
  return state.auth.isOidcLoginPending
}

export const selectIsSessionCheckPending = (state: RootState): boolean => {
  return state.auth.isSessionCheckPending
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
