import { useCallback, useEffect, useRef, useState } from 'react'
import { clearAuthCookie, getAuthCookieData, setAuthCookie } from '../store/cookieStorage'
import { getStoreInstance } from '@/store'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { HYPERNATIVE_OAUTH_CONFIG } from '../config/oauth'

type AuthTokenResult = {
  token: string | undefined
  isAuthenticated: boolean
  isExpired: boolean
}

type SetTokenResult = (
  token: string,
  tokenType: string,
  expiresIn: number,
  refreshToken?: string,
  refreshExpiresIn?: number,
) => void
type ClearTokenResult = () => void

type CookieAuthData = ReturnType<typeof getAuthCookieData>

/**
 * Polling interval in milliseconds
 * Used to check authentication state periodically
 */
const AUTH_POLLING_INTERVAL = 5000

/**
 * How long before the access token expires to refresh it, so no request ever rides an expired token
 */
const REFRESH_MARGIN_MS = 60 * 1000

/**
 * setTimeout's delay is a signed 32-bit int - anything above ~24.8 days wraps around and fires
 * immediately. Clamping to this and re-checking on fire converges to the real refresh time.
 */
const MAX_TIMEOUT_DELAY_MS = 2 ** 31 - 1

/**
 * Web Locks name used to serialise refreshes across tabs sharing the same auth cookie
 */
const REFRESH_LOCK_NAME = 'hypernative-auth-refresh'

/**
 * Upper bound for the jitter used when navigator.locks isn't available, to reduce (not eliminate)
 * the chance of two tabs refreshing at the same instant
 */
const REFRESH_JITTER_MAX_MS = 250

/**
 * Refresh the access token using the given refresh token.
 *
 * Serialised via navigator.locks (falling back to a jittered cookie re-read) so a losing tab
 * re-reads the winner's rotated token instead of replaying one the server has already consumed -
 * doing so would revoke the whole refresh chain.
 * @param refreshToken - The refresh token this call was scheduled for
 */
const refreshAuthToken = async (refreshToken: string): Promise<void> => {
  const runRefresh = async (): Promise<void> => {
    // Re-read inside the lock: another tab (or hook instance) may have already rotated this token
    const current = getAuthCookieData()
    if (!current?.refreshToken || current.refreshToken !== refreshToken) {
      return
    }

    let store
    try {
      store = getStoreInstance()
    } catch {
      // Store not initialised yet; the next scheduled check will retry
      return
    }

    try {
      const response = await store
        .dispatch(
          hypernativeApi.endpoints.refreshToken.initiate({
            grant_type: 'refresh_token',
            client_id: HYPERNATIVE_OAUTH_CONFIG.clientId,
            refresh_token: current.refreshToken,
          }),
        )
        .unwrap()

      setAuthCookie(
        response.access_token,
        response.token_type,
        response.expires_in,
        response.refresh_token,
        response.refresh_expires_in,
      )
    } catch {
      // invalid_grant (or any other failure) is terminal - the chain is gone, only a fresh login recovers
      clearAuthCookie()
    }
  }

  if (typeof navigator !== 'undefined' && navigator.locks) {
    await navigator.locks.request(REFRESH_LOCK_NAME, runRefresh)
  } else {
    await new Promise((resolve) => setTimeout(resolve, Math.random() * REFRESH_JITTER_MAX_MS))
    await runRefresh()
  }
}

/**
 * Hook to retrieve authentication token and status from cookie storage, and to silently keep the
 * access token fresh via the refresh token while the refresh window is open.
 * @returns Object containing token value, isAuthenticated flag, and isExpired flag
 */
export const useAuthToken = (): [AuthTokenResult, SetTokenResult, ClearTokenResult] => {
  const [authState, setAuthState] = useState<AuthTokenResult>({
    token: undefined,
    isAuthenticated: false,
    isExpired: false,
  })

  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduledRefreshTokenRef = useRef<string | undefined>(undefined)
  const isRefreshingRef = useRef(false)
  const checkAuthStateRef = useRef<() => void>(() => {})

  const clearScheduledRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
    scheduledRefreshTokenRef.current = undefined
  }, [])

  const attemptRefresh = useCallback((refreshToken: string) => {
    if (isRefreshingRef.current) {
      return
    }
    isRefreshingRef.current = true
    void refreshAuthToken(refreshToken).finally(() => {
      isRefreshingRef.current = false
      checkAuthStateRef.current()
    })
  }, [])

  // Schedules (or immediately triggers) the next refresh for the current cookie data.
  // A cookie with no refreshToken degrades to "no refresh available" - the access token just
  // runs out at its own expiry and the user has to log in again.
  const scheduleRefresh = useCallback(
    (data: CookieAuthData) => {
      if (!data?.refreshToken) {
        clearScheduledRefresh()
        return
      }

      const delay = data.expiry - REFRESH_MARGIN_MS - Date.now()
      if (delay <= 0) {
        clearScheduledRefresh()
        attemptRefresh(data.refreshToken)
        return
      }

      if (scheduledRefreshTokenRef.current === data.refreshToken && refreshTimeoutRef.current) {
        return
      }

      clearScheduledRefresh()
      scheduledRefreshTokenRef.current = data.refreshToken
      refreshTimeoutRef.current = setTimeout(() => checkAuthStateRef.current(), Math.min(delay, MAX_TIMEOUT_DELAY_MS))
    },
    [clearScheduledRefresh, attemptRefresh],
  )

  const checkAuthState = useCallback(() => {
    const data = getAuthCookieData()
    const { token, expiry, tokenType } = data || {}
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

    scheduleRefresh(data)
  }, [scheduleRefresh])

  useEffect(() => {
    checkAuthStateRef.current = checkAuthState
  }, [checkAuthState])

  const setToken = (
    token: string,
    tokenType: string,
    expiresIn: number,
    refreshToken?: string,
    refreshExpiresIn?: number,
  ) => {
    setAuthCookie(token, tokenType, expiresIn, refreshToken, refreshExpiresIn)
    checkAuthState()
  }

  const clearToken = () => {
    clearAuthCookie()
    clearScheduledRefresh()
    setAuthState({
      token: undefined,
      isAuthenticated: false,
      isExpired: false,
    })
  }

  // Update auth state when cookies change (e.g., from other tabs), when the app resumes from the
  // background (sleep/wake can leave a scheduled refresh timer never firing), and periodically
  useEffect(() => {
    const handleStorageEvent = () => checkAuthState()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuthState()
      }
    }

    window.addEventListener('storage', handleStorageEvent)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', checkAuthState)

    const interval = setInterval(checkAuthState, AUTH_POLLING_INTERVAL)
    checkAuthState() // Initial check

    return () => {
      window.removeEventListener('storage', handleStorageEvent)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', checkAuthState)
      clearInterval(interval)
      clearScheduledRefresh()
    }
  }, [checkAuthState, clearScheduledRefresh])

  return [authState, setToken, clearToken]
}
