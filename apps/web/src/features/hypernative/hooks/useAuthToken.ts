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
 * OAuth error codes (RFC 6749 §5.2) that mean the refresh chain is gone and only a fresh login
 * recovers it. Anything else - a dropped connection, a 5xx, a proxy interposing a 403 - leaves the
 * chain intact, so it must not end the session.
 */
const TERMINAL_OAUTH_ERRORS = ['invalid_grant', 'invalid_client', 'unsupported_grant_type', 'invalid_request']

/**
 * Backoff for a refresh that failed without saying the chain is dead.
 *
 * The schedule deliberately stays inside the server's reuse grace window. Inside it, presenting
 * the same refresh token again is idempotent and returns the same successor, so a response lost in
 * transit costs nothing. Past it, that same request reads as a replay: it revokes the whole family
 * and reports a reuse. Since the user ends up logging in again either way, we stop retrying rather
 * than trade a quiet expiry for a false theft signal.
 */
const REFRESH_RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000]

type RefreshOutcome = 'refreshed' | 'terminal' | 'transient'

/**
 * Reads the OAuth error code out of a failed refresh.
 *
 * The API wraps errors in an envelope, so the code sits at `error.error` rather than at the top
 * level of the body. A failure with no code at all - a network error, a gateway page - resolves to
 * undefined and is treated as transient.
 * @param rejection - The value `.unwrap()` rejected with
 */
const readOAuthErrorCode = (rejection: unknown): string | undefined => {
  const envelopeError = (rejection as { error?: unknown } | undefined)?.error
  const code = (envelopeError as { error?: unknown } | undefined)?.error
  return typeof code === 'string' ? code : undefined
}

/**
 * Refresh the access token using the given refresh token.
 *
 * Serialised via navigator.locks (falling back to a jittered cookie re-read) so a losing tab
 * re-reads the winner's rotated token instead of replaying one the server has already consumed -
 * doing so would revoke the whole refresh chain.
 * Reports what happened rather than acting on it, so the caller can tell a dead chain from a
 * failure worth retrying.
 * @param refreshToken - The refresh token this call was scheduled for
 */
const refreshAuthToken = async (refreshToken: string): Promise<RefreshOutcome> => {
  const runRefresh = async (): Promise<RefreshOutcome> => {
    // Re-read inside the lock: another tab (or hook instance) may have already rotated this token
    const current = getAuthCookieData()
    if (!current?.refreshToken || current.refreshToken !== refreshToken) {
      return 'refreshed'
    }

    let store
    try {
      store = getStoreInstance()
    } catch {
      // Store not initialised yet; the next scheduled check will retry
      return 'transient'
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
      return 'refreshed'
    } catch (rejection) {
      const code = readOAuthErrorCode(rejection)
      return code !== undefined && TERMINAL_OAUTH_ERRORS.includes(code) ? 'terminal' : 'transient'
    }
  }

  if (typeof navigator !== 'undefined' && navigator.locks) {
    return (await navigator.locks.request(REFRESH_LOCK_NAME, runRefresh)) as RefreshOutcome
  }

  await new Promise((resolve) => setTimeout(resolve, Math.random() * REFRESH_JITTER_MAX_MS))
  return await runRefresh()
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
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduledRefreshTokenRef = useRef<string | undefined>(undefined)
  const isRefreshingRef = useRef(false)
  const checkAuthStateRef = useRef<() => void>(() => {})
  // A token whose retries are spent. Kept so the polling loop does not present it again once the
  // grace window has closed, which would read as a replay and revoke the family.
  const abandonedRefreshTokenRef = useRef<string | undefined>(undefined)
  const attemptRefreshRef = useRef<(refreshToken: string, attempt?: number) => void>(() => {})

  const clearScheduledRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
    scheduledRefreshTokenRef.current = undefined
  }, [])

  const attemptRefresh = useCallback((refreshToken: string, attempt = 0) => {
    if (isRefreshingRef.current) {
      return
    }
    isRefreshingRef.current = true
    void refreshAuthToken(refreshToken)
      .then((outcome) => {
        if (outcome === 'refreshed') {
          abandonedRefreshTokenRef.current = undefined
          return
        }

        if (outcome === 'terminal') {
          // The server says this chain is gone. Only a fresh login recovers it.
          abandonedRefreshTokenRef.current = undefined
          clearAuthCookie()
          return
        }

        const delay = REFRESH_RETRY_DELAYS_MS[attempt]
        if (delay === undefined) {
          if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            // Offline: the request never left the browser, so the token is untouched. Wait for the
            // online event rather than burning the token or ending the session.
            return
          }

          // Retries spent inside the grace window. The cookie stays: the access token is still
          // usable until its own expiry, and presenting this refresh token again now would look
          // like theft rather than a retry.
          abandonedRefreshTokenRef.current = refreshToken
          return
        }

        retryTimeoutRef.current = setTimeout(() => {
          // Drop the handle as it fires: leaving a spent one in place reads as "a retry is still
          // pending" to scheduleRefresh, which then declines to start another attempt ever again.
          retryTimeoutRef.current = null
          attemptRefreshRef.current(refreshToken, attempt + 1)
        }, delay)
      })
      .finally(() => {
        isRefreshingRef.current = false
        checkAuthStateRef.current()
      })
  }, [])

  useEffect(() => {
    attemptRefreshRef.current = attemptRefresh
  }, [attemptRefresh])

  // Schedules (or immediately triggers) the next refresh for the current cookie data.
  // A cookie with no refreshToken degrades to "no refresh available" - the access token just
  // runs out at its own expiry and the user has to log in again.
  const scheduleRefresh = useCallback(
    (data: CookieAuthData) => {
      if (!data?.refreshToken) {
        clearScheduledRefresh()
        return
      }

      if (abandonedRefreshTokenRef.current === data.refreshToken) {
        return
      }

      const delay = data.expiry - REFRESH_MARGIN_MS - Date.now()
      if (delay <= 0) {
        if (retryTimeoutRef.current) {
          return
        }
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
    abandonedRefreshTokenRef.current = undefined
    checkAuthState()
  }

  const clearToken = () => {
    clearAuthCookie()
    clearScheduledRefresh()
    abandonedRefreshTokenRef.current = undefined
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
    // Coming back online means the failures that spent this token's retries never reached the
    // server, so the token is still live and presenting it again is a retry rather than a replay.
    // Ambiguous failures - a 5xx, a proxy error - do not come back through here and stay abandoned.
    const handleOnline = () => {
      abandonedRefreshTokenRef.current = undefined
      checkAuthState()
    }

    window.addEventListener('storage', handleStorageEvent)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', checkAuthState)
    window.addEventListener('online', handleOnline)

    const interval = setInterval(checkAuthState, AUTH_POLLING_INTERVAL)
    checkAuthState() // Initial check

    return () => {
      window.removeEventListener('storage', handleStorageEvent)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', checkAuthState)
      window.removeEventListener('online', handleOnline)
      clearInterval(interval)
      clearScheduledRefresh()
    }
  }, [checkAuthState, clearScheduledRefresh])

  return [authState, setToken, clearToken]
}
