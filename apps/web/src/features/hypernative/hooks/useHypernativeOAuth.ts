import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppDispatch } from '@/store'
import { setAuthCookie, clearAuthCookie, isAuthenticated, isExpired } from '../store/cookieStorage'
import { HYPERNATIVE_OAUTH_CONFIG, MOCK_AUTH_ENABLED, getRedirectUri } from '../config/oauth'
import { showNotification } from '@/store/notificationsSlice'
import Cookies from 'js-cookie'

/**
 * OAuth authentication status and controls
 */
export type HypernativeAuthStatus = {
  /** Whether the user has a valid, non-expired auth token */
  isAuthenticated: boolean
  /** Whether the current token has expired */
  isTokenExpired: boolean
  /** Whether authentication flow is in progress */
  loading: boolean
  /** Initiates OAuth login flow (popup or new tab) */
  initiateLogin: () => void
  /** Clears authentication token and logs out user */
  logout: () => void
}

/**
 * PKCE storage key in cookies
 * Stores both state and codeVerifier as a single JSON object: { state, codeVerifier }
 * Uses cookies instead of sessionStorage to support OAuth popup flow where
 * the callback page runs in a separate browsing context.
 */
const PKCE_KEY = 'hn_pkce'

/**
 * Cookie options for PKCE storage
 * - Secure: Only sent over HTTPS (when available)
 * - SameSite: Lax - protects against CSRF while allowing OAuth redirects
 * - Path: Root path so it's accessible from callback route
 * - MaxAge: 10 minutes (600 seconds) - matches typical OAuth flow duration
 */
const getCookieOptions = (): Cookies.CookieAttributes => {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  return {
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    expires: 10 / (24 * 60), // 10 minutes
  }
}

/**
 * PostMessage event type for successful authentication
 * Sent from OAuth callback page to parent window when token exchange succeeds
 */
export const HN_AUTH_SUCCESS_EVENT = 'HN_AUTH_SUCCESS'

/**
 * PostMessage event type for authentication error
 * Sent from OAuth callback page to parent window when OAuth flow fails
 */
export const HN_AUTH_ERROR_EVENT = 'HN_AUTH_ERROR'

/**
 * Mock token expiry time in seconds (10 minutes)
 * Used when MOCK_AUTH_ENABLED is true for development
 * Matches Hypernative OAuth API specification default expiry
 */
const MOCK_TOKEN_EXPIRES_IN = 600

/**
 * Mock authentication delay in milliseconds
 * Simulates network latency for realistic testing
 */
const MOCK_AUTH_DELAY_MS = 1000

/**
 * OAuth popup window dimensions
 */
const POPUP_WIDTH = 600
const POPUP_HEIGHT = 800

/**
 * Base64url encode a byte array
 * Converts bytes to base64 and then replaces URL-unsafe characters per RFC 4648
 * @param bytes - Uint8Array of bytes to encode
 * @returns Base64url-encoded string
 */
function base64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * PKCE data structure stored in cookies
 */
export interface PkceData {
  state?: string
  codeVerifier?: string
}

/**
 * Save PKCE data (state and codeVerifier) to secure cookie as a single JSON object
 * This ensures state and verifier are always paired together
 * Uses cookies instead of sessionStorage to support OAuth popup flow where
 * the callback page runs in a separate browsing context (popup window).
 *
 * @param state - OAuth state parameter for CSRF protection
 * @param codeVerifier - PKCE code verifier for token exchange
 */
export function savePkce(state: string, codeVerifier: string): void {
  const data = JSON.stringify({ state, codeVerifier })
  Cookies.set(PKCE_KEY, data, getCookieOptions())
}

/**
 * Read PKCE data from secure cookie
 * Returns parsed JSON object with state and codeVerifier, or empty object if not found
 * @returns PKCE data object with optional state and codeVerifier
 */
export function readPkce(): PkceData {
  try {
    const cookieValue = Cookies.get(PKCE_KEY)
    if (!cookieValue) {
      return {}
    }
    return JSON.parse(cookieValue)
  } catch (error) {
    console.error('Failed to parse PKCE data from cookie:', error)
    return {}
  }
}

/**
 * Clear PKCE data from secure cookie
 * Should be called after successful token exchange or on error
 */
export function clearPkce(): void {
  Cookies.remove(PKCE_KEY, { path: '/' })
}

/**
 * Generate SHA256 hash of the code verifier for PKCE challenge
 * The code challenge is sent in the authorization request, and the verifier
 * is sent in the token exchange request. The server verifies they match.
 * @param verifier - The PKCE code verifier string
 * @returns Base64url-encoded SHA256 hash of the verifier
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hash))
  const base64 = btoa(String.fromCharCode(...hashArray))
  // Convert to base64url (replace +/= with -_)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * Build OAuth authorization URL with PKCE challenge
 * Generates PKCE parameters, stores them in sessionStorage, and constructs
 * the full authorization URL with all required query parameters.
 * @returns Complete OAuth authorization URL
 */
async function buildAuthUrl(): Promise<string> {
  const { authUrl, clientId, scope } = HYPERNATIVE_OAUTH_CONFIG
  const redirectUri = getRedirectUri()

  // Generate PKCE code verifier using base64url encoding of 32 random bytes
  // This produces ~43 characters, matching RFC 7636 standard
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  const codeVerifier = base64urlEncode(randomBytes)
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  // Generate OAuth state parameter for CSRF protection using UUID v4
  // UUID provides better uniqueness guarantees and is the standard approach
  const state = crypto.randomUUID()

  // Store verifier and state together as a single JSON object
  // This ensures they are always paired and prevents mismatches
  savePkce(state, codeVerifier)

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return `${authUrl}?${params.toString()}`
}

/**
 * Hook for managing Hypernative OAuth authentication
 * Provides login/logout controls and authentication state.
 *
 * Features:
 * - PKCE flow for secure OAuth in public clients
 * - Popup-first approach with fallback to new tab
 * - PostMessage communication with callback page
 * - Mock mode for development without real OAuth endpoints
 * - Automatic cleanup of popup windows
 *
 * @returns Authentication status and control functions
 */
export const useHypernativeOAuth = (): HypernativeAuthStatus => {
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [authState, setAuthState] = useState({
    isAuthenticated: isAuthenticated(),
    isTokenExpired: isExpired(),
  })

  // Reference to popup window for cleanup
  const popupRef = useRef<Window | null>(null)
  // Track if we've received a success/error message to avoid false positives when popup closes
  const hasReceivedMessageRef = useRef(false)
  // Reference to popup check interval
  const popupCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  // Reference to timeout for new tab fallback (when popup is blocked)
  const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Clear all timers and intervals
   */
  const clearAllTimers = useCallback(() => {
    if (popupCheckIntervalRef.current) {
      clearInterval(popupCheckIntervalRef.current)
      popupCheckIntervalRef.current = null
    }
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current)
      fallbackTimeoutRef.current = null
    }
  }, [])

  /**
   * Close popup window if it's still open
   */
  const closePopup = useCallback(() => {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
      popupRef.current = null
    }
  }, [])

  /**
   * Clean up after authentication completes (success or error)
   */
  const cleanupAfterAuth = useCallback(() => {
    setLoading(false)
    clearAllTimers()
    closePopup()
  }, [clearAllTimers, closePopup])

  /**
   * Handle postMessage events from OAuth callback page
   * Listens for success/error messages and updates auth state accordingly
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify message origin matches our app (security check)
      if (event.origin !== window.location.origin) {
        return
      }

      // Handle successful authentication
      if (event.data?.type === HN_AUTH_SUCCESS_EVENT) {
        hasReceivedMessageRef.current = true
        const { token, expiresIn } = event.data
        if (token && expiresIn) {
          setAuthCookie(token, expiresIn)
          setAuthState({
            isAuthenticated: isAuthenticated(),
            isTokenExpired: isExpired(),
          })
        }
        cleanupAfterAuth()
      }

      // Handle authentication error
      if (event.data?.type === HN_AUTH_ERROR_EVENT) {
        hasReceivedMessageRef.current = true
        console.error('Hypernative OAuth error:', event.data.error)
        cleanupAfterAuth()
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      clearAllTimers()
    }
  }, [dispatch, cleanupAfterAuth, clearAllTimers])

  /**
   * Show notification when popup is blocked with a clickable link
   */
  const showPopupBlockedNotification = useCallback(
    (authUrl: string) => {
      setLoading(false)
      dispatch(
        showNotification({
          message: 'Popup blocked. Click the link below to complete authentication.',
          variant: 'error',
          groupKey: 'hypernative-auth-blocked',
          link: {
            onClick: () => window.open(authUrl, '_blank'),
            title: 'Open authentication page',
          },
        }),
      )
    },
    [dispatch],
  )

  /**
   * Show notification when authentication is cancelled
   */
  const showAuthCancelledNotification = useCallback(() => {
    setLoading(false)
    dispatch(
      showNotification({
        message: 'Authentication cancelled. Please try again to log in to Hypernative.',
        variant: 'error',
        groupKey: 'hypernative-auth-cancelled',
      }),
    )
  }, [dispatch])

  /**
   * Set up timeout fallback to reset loading state if no message is received
   */
  const setupTimeoutFallback = useCallback(() => {
    fallbackTimeoutRef.current = setTimeout(
      () => {
        if (!hasReceivedMessageRef.current) {
          showAuthCancelledNotification()
        }
      },
      // 5 minutes timeout
      5 * 60 * 1000,
    )
  }, [showAuthCancelledNotification])

  /**
   * Set up popup monitoring interval to detect when popup is closed
   */
  const setupPopupMonitoring = useCallback(
    (popup: Window) => {
      popupRef.current = popup
      popupCheckIntervalRef.current = setInterval(() => {
        if (popupRef.current?.closed && !hasReceivedMessageRef.current) {
          popupRef.current = null
          showAuthCancelledNotification()

          if (popupCheckIntervalRef.current) {
            clearInterval(popupCheckIntervalRef.current)
            popupCheckIntervalRef.current = null
          }
        }
      }, 500) // Check every 500ms
    },
    [showAuthCancelledNotification],
  )

  /**
   * Try to open authentication in a new tab and handle the result
   */
  const tryOpenNewTab = useCallback(
    (authUrl: string, useAnimationFrame = false) => {
      const openTab = () => {
        const newTab = window.open(authUrl, '_blank')
        if (!newTab || newTab.closed) {
          showPopupBlockedNotification(authUrl)
        } else {
          setupTimeoutFallback()
        }
      }

      if (useAnimationFrame) {
        requestAnimationFrame(openTab)
      } else {
        openTab()
      }
    },
    [showPopupBlockedNotification, setupTimeoutFallback],
  )

  /**
   * Handle OAuth flow error
   */
  const handleOAuthError = useCallback(
    (error: unknown) => {
      console.error('Failed to initiate Hypernative OAuth:', error)
      setLoading(false)
      clearAllTimers()
    },
    [clearAllTimers],
  )

  /**
   * Handle popup opening and blocking scenarios
   */
  const handlePopupOpen = useCallback(
    (authUrl: string, popup: Window | null) => {
      if (!popup) {
        // Popup completely blocked (returns null) - try new tab immediately
        tryOpenNewTab(authUrl)
      } else if (popup.closed) {
        // Popup was opened but immediately closed (blocked by browser)
        // Use requestAnimationFrame to stay in user interaction context
        tryOpenNewTab(authUrl, true)
      } else {
        // Popup opened successfully - verify it stays open
        // Some browsers might close it after a short delay
        setTimeout(() => {
          if (popup.closed && !hasReceivedMessageRef.current) {
            // Popup was closed after opening (blocked) - fallback to new tab
            // Only open new tab if we haven't received a success/error message
            // (which would indicate successful auth and popup closure)
            tryOpenNewTab(authUrl)
          } else if (!popup.closed) {
            // Popup is still open - set up normal popup monitoring
            setupPopupMonitoring(popup)
          }
          // If popup.closed && hasReceivedMessageRef.current, auth completed successfully
          // so we don't need to do anything (cleanupAfterAuth already handled it)
        }, 100) // Check after 100ms to catch delayed closures
      }
    },
    [tryOpenNewTab, setupPopupMonitoring],
  )

  /**
   * Initiate OAuth login flow
   * - In mock mode: immediately set a mock token
   * - In real mode: open popup/tab with OAuth authorization URL
   */
  const initiateLogin = useCallback(async () => {
    setLoading(true)
    hasReceivedMessageRef.current = false
    clearAllTimers()

    try {
      // Mock authentication for development
      if (MOCK_AUTH_ENABLED) {
        // Simulate async token exchange
        await new Promise((resolve) => setTimeout(resolve, MOCK_AUTH_DELAY_MS))

        const mockToken = `mock-token-${Date.now()}`
        setAuthCookie(mockToken, MOCK_TOKEN_EXPIRES_IN)
        setAuthState({
          isAuthenticated: isAuthenticated(),
          isTokenExpired: isExpired(),
        })
        setLoading(false)
        return
      }

      // Real OAuth flow
      const authUrl = await buildAuthUrl()

      // Calculate centered position for popup
      const left = window.screen.width / 2 - POPUP_WIDTH / 2
      const top = window.screen.height / 2 - POPUP_HEIGHT / 2

      // Try to open popup first (better UX)
      const popup = window.open(
        authUrl,
        'hypernative-oauth',
        `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},popup=1`,
      )

      handlePopupOpen(authUrl, popup)
    } catch (error) {
      handleOAuthError(error)
    }
  }, [dispatch, clearAllTimers, handlePopupOpen, handleOAuthError])

  /**
   * Logout - clear authentication token
   */
  const logout = useCallback(() => {
    clearAuthCookie()
    setAuthState({
      isAuthenticated: isAuthenticated(),
      isTokenExpired: isExpired(),
    })
  }, [])

  // Update auth state when cookies change (e.g., from other tabs)
  useEffect(() => {
    const checkAuthState = () => {
      setAuthState({
        isAuthenticated: isAuthenticated(),
        isTokenExpired: isExpired(),
      })
    }

    // Check auth state periodically to catch cookie changes
    const interval = setInterval(checkAuthState, 1000)
    checkAuthState() // Initial check

    return () => clearInterval(interval)
  }, [])

  return {
    isAuthenticated: authState.isAuthenticated,
    isTokenExpired: authState.isTokenExpired,
    loading,
    initiateLogin,
    logout,
  }
}
