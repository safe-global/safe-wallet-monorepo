import { useEffect, useState, useCallback } from 'react'
import { clearAuthCookie, getAuthCookieData, setAuthCookie } from '../store/cookieStorage'

type AuthTokenResult = {
  token: string | undefined
  isAuthenticated: boolean
  isExpired: boolean
}

type SetTokenResult = (token: string, tokenType: string, expiresIn: number) => void
type ClearTokenResult = () => void

/**
 * Polling interval in milliseconds
 * Used to check authentication state periodically
 */
const AUTH_POLLING_INTERVAL = 5000

/**
 * Hook to retrieve authentication token and status from cookie storage
 * @returns Object containing token value, isAuthenticated flag, and isExpired flag
 */
export const useAuthToken = (): [AuthTokenResult, SetTokenResult, ClearTokenResult] => {
  const [authState, setAuthState] = useState<AuthTokenResult>({
    token: undefined,
    isAuthenticated: false,
    isExpired: false,
  })

  const checkAuthState = useCallback(() => {
    const { token, expiry, tokenType } = getAuthCookieData() || {}
    // Default to 'Bearer' if tokenType is missing, undefined, or empty
    // This handles legacy cookies or corrupted data gracefully
    const normalizedTokenType = tokenType?.trim() || 'Bearer'
    // isExpired should only be true when a token exists AND it's expired
    // If no token exists, isExpired should be false (not expired, just not authenticated)
    const isExpired = !!token && (expiry === undefined || Date.now() >= expiry)
    const newToken = token ? `${normalizedTokenType} ${token}` : undefined
    const newIsAuthenticated = !!token

    setAuthState((prevState) => {
      // Only update state if values actually changed
      if (
        prevState.token === newToken &&
        prevState.isAuthenticated === newIsAuthenticated &&
        prevState.isExpired === isExpired
      ) {
        return prevState
      }
      return {
        token: newToken,
        isAuthenticated: newIsAuthenticated,
        isExpired,
      }
    })
  }, [])

  const setToken = (token: string, tokenType: string, expiresIn: number) => {
    setAuthCookie(token, tokenType, expiresIn)
    checkAuthState()
  }

  const clearToken = () => {
    clearAuthCookie()
    setAuthState({
      token: undefined,
      isAuthenticated: false,
      isExpired: false,
    })
  }

  // Update auth state when cookies change (e.g., from other tabs)
  useEffect(() => {
    // Check auth state when storage event occurs
    const handleStorageEvent = () => checkAuthState()
    window.addEventListener('storage', handleStorageEvent)

    // Additionally, check auth state periodically to catch cookie changes
    const interval = setInterval(checkAuthState, AUTH_POLLING_INTERVAL)
    checkAuthState() // Initial check

    return () => {
      window.removeEventListener('storage', handleStorageEvent)
      clearInterval(interval)
    }
  }, [])

  return [authState, setToken, clearToken]
}
