import type { PayloadAction } from '@reduxjs/toolkit'
import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { RootState } from '@/store'

/**
 * Redux slice for managing Hypernative authentication state (per-user, not per-Safe).
 * Stores OAuth token globally - user logs in once and token is shared across all Safes.
 * Automatically persisted to localStorage.
 */

export type HnAuthState = {
  authToken?: string
  authTokenExpiry?: number
  isAuthenticated: boolean
}

const initialState: HnAuthState = {
  authToken: undefined,
  authTokenExpiry: undefined,
  isAuthenticated: false,
}

export const hnAuthSlice = createSlice({
  name: 'hnAuth',
  initialState,
  reducers: {
    /**
     * Set authentication token after successful OAuth login
     * @param token - OAuth access token
     * @param expiresIn - Token lifetime in seconds
     */
    setAuthToken: (state, { payload }: PayloadAction<{ token: string; expiresIn: number }>) => {
      const { token, expiresIn } = payload
      state.authToken = token
      state.authTokenExpiry = Date.now() + expiresIn * 1000
      state.isAuthenticated = true
    },

    /**
     * Clear authentication token (logout or token expired)
     */
    clearAuthToken: (state) => {
      state.authToken = undefined
      state.authTokenExpiry = undefined
      state.isAuthenticated = false
    },
  },
})

export const { setAuthToken, clearAuthToken } = hnAuthSlice.actions

/**
 * Select the entire HN auth state
 */
export const selectHnAuthState = (state: RootState): HnAuthState => state[hnAuthSlice.name] || initialState

/**
 * Select whether user is authenticated
 */
export const selectIsAuthenticated = createSelector([selectHnAuthState], (authState): boolean => {
  return authState.isAuthenticated
})

/**
 * Select auth token if available and not expired
 */
export const selectAuthToken = createSelector([selectHnAuthState], (authState): string | undefined => {
  if (!authState.authToken || !authState.authTokenExpiry) {
    return undefined
  }

  // Check if token is expired
  const isExpired = Date.now() >= authState.authTokenExpiry
  if (isExpired) {
    return undefined
  }

  return authState.authToken
})

/**
 * Select whether token is expired
 */
export const selectIsTokenExpired = createSelector([selectHnAuthState], (authState): boolean => {
  if (!authState.authTokenExpiry) {
    return true
  }

  return Date.now() >= authState.authTokenExpiry
})
