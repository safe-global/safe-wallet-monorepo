import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
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
 * Select whether user is authenticated with a valid, non-expired token
 * Returns false if token is expired or missing
 *
 * Note: This is a regular selector function (not memoized) because it needs to
 * check Date.now() on every call to detect token expiration, even when Redux
 * state hasn't changed. Using createSelector would cache the Date.now() result
 * and prevent expiration detection.
 */
export const selectIsAuthenticated = (state: RootState): boolean => {
  const authState = selectHnAuthState(state)
  if (!authState.isAuthenticated || !authState.authToken || !authState.authTokenExpiry) {
    return false
  }

  // Check if token is expired (always check current time, not cached)
  const isExpired = Date.now() >= authState.authTokenExpiry
  return !isExpired
}

/**
 * Select auth token if available and not expired
 *
 * Note: This is a regular selector function (not memoized) because it needs to
 * check Date.now() on every call to detect token expiration, even when Redux
 * state hasn't changed. Using createSelector would cache the Date.now() result
 * and prevent expiration detection.
 */
export const selectAuthToken = (state: RootState): string | undefined => {
  const authState = selectHnAuthState(state)
  if (!authState.authToken || !authState.authTokenExpiry) {
    return undefined
  }

  // Check if token is expired (always check current time, not cached)
  const isExpired = Date.now() >= authState.authTokenExpiry
  if (isExpired) {
    return undefined
  }

  return authState.authToken
}

/**
 * Select whether token is expired
 *
 * Note: This is a regular selector function (not memoized) because it needs to
 * check Date.now() on every call to detect token expiration, even when Redux
 * state hasn't changed. Using createSelector would cache the Date.now() result
 * and prevent expiration detection.
 */
export const selectIsTokenExpired = (state: RootState): boolean => {
  const authState = selectHnAuthState(state)
  if (!authState.authTokenExpiry) {
    return true
  }

  // Always check current time, not cached
  return Date.now() >= authState.authTokenExpiry
}
