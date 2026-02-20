import { useCallback, useEffect, useRef } from 'react'
import { useAppDispatch } from '@/store'
import { HYPERNATIVE_OAUTH_CONFIG, MOCK_AUTH_ENABLED, getRedirectUri } from '../config/oauth'
import { showNotification } from '@/store/notificationsSlice'
import Cookies from 'js-cookie'
import { useAuthToken } from './useAuthToken'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'

/**
 * OAuth authentication status and controls
 */
export type HypernativeAuthStatus = {
  /** Whether the user has a valid, non-expired auth token */
  isAuthenticated: boolean
  /** Whether the current token has expired */
  isTokenExpired: boolean
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
 * PKCE cookie expiry time in seconds
 */
const PKCE_COOKIE_EXPIRES_IN = 10 * 60 // 10 minutes

/**
 * Cookie options for PKCE storage
 * - Secure: Only sent over HTTPS (when available)
 * - SameSite: Lax - protects against CSRF while allowing OAuth redirects
 * - Path: Root path so it's accessible from callback route
 * - Expires: Token expiry time in days
 */
const getPkceCookieOptions = (): Cookies.CookieAttributes => {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  return {
    secure: isSecure,
    sameSite: 'lax',
    path: '/',
    expires: PKCE_COOKIE_EXPIRES_IN / (24 * 60 * 60), // Convert seconds to days
  }
}

/**
 * Mock authentication delay in milliseconds
 * Simulates network latency for realistic testing
 */
const MOCK_AUTH_DELAY_MS = 1000

/**
 * Mock authentication token expiry time in seconds
 */
const MOCK_AUTH_TOKEN_EXPIRES_IN = 10 * 60 // 10 minutes

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
function base64urlEncode(bytes: Uint8Array | number[]): string {
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
  Cookies.set(PKCE_KEY, data, getPkceCookieOptions())
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
  return base64urlEncode(hashArray)
}

/**
 * Build OAuth authorization URL with PKCE challenge
 * Generates PKCE parameters, stores them in sessionStorage, and constructs
 * the full authorization URL with all required query parameters.
 * @param chainId - Optional chain ID to verify Safe ownership
 * @param safeAddress - Optional Safe address to verify ownership
 * @returns Complete OAuth authorization URL
 */
async function buildAuthUrl(chainId?: string, safeAddress?: string): Promise<string> {
  const { authUrl, clientId } = HYPERNATIVE_OAUTH_CONFIG

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
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  // Add chain and safe parameters if provided to verify Safe ownership
  if (chainId) {
    params.append('chain', chainId)
  }
  if (safeAddress) {
    params.append('safe', safeAddress)
  }

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
  const [{ isAuthenticated, isExpired }, setToken, clearToken] = useAuthToken()
  const { safeAddress } = useSafeInfo()
  const chainId = useChainId()

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
   * Show notification when popup is blocked with a clickable link
   */
  const showPopupBlockedNotification = useCallback(
    (authUrl: string) => {
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
   * Try to open authentication in a new tab and handle the result
   */
  const tryOpenNewTab = useCallback(
    (authUrl: string, useAnimationFrame = false) => {
      const openTab = () => {
        const newTab = window.open(authUrl, '_blank')
        if (!newTab || newTab.closed) {
          showPopupBlockedNotification(authUrl)
        }
      }

      if (useAnimationFrame) {
        requestAnimationFrame(openTab)
      } else {
        openTab()
      }
    },
    [showPopupBlockedNotification],
  )

  /**
   * Handle OAuth flow error
   */
  const handleOAuthError = useCallback(
    (error: unknown) => {
      console.error('Failed to initiate Hypernative OAuth:', error)
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
      }
    },
    [tryOpenNewTab],
  )

  /**
   * Initiate OAuth login flow
   * - In mock mode: immediately set a mock token
   * - In real mode: open popup/tab with OAuth authorization URL
   */
  const initiateLogin = useCallback(async () => {
    clearAllTimers()

    try {
      // Mock authentication for development
      if (MOCK_AUTH_ENABLED) {
        // Simulate async token exchange
        await new Promise((resolve) => setTimeout(resolve, MOCK_AUTH_DELAY_MS))

        const mockToken = `mock-token-${Date.now()}`
        setToken(mockToken, 'Bearer', MOCK_AUTH_TOKEN_EXPIRES_IN)
        return
      }

      // Real OAuth flow
      const authUrl = await buildAuthUrl(chainId, safeAddress)

      // Calculate centered position for popup relative to current window
      // Center in the current window's viewport, accounting for window position on screen
      const left = window.screenX + window.innerWidth / 2 - POPUP_WIDTH / 2
      const top = window.screenY + window.innerHeight / 2 - POPUP_HEIGHT / 2

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
  }, [clearAllTimers, handlePopupOpen, handleOAuthError, setToken, chainId, safeAddress])

  /**
   * Logout - clear authentication token
   */
  const logout = useCallback(() => clearToken(), [clearToken])

  useEffect(() => {
    return () => clearAllTimers()
  }, [clearAllTimers])

  return {
    isAuthenticated,
    isTokenExpired: isExpired,
    initiateLogin,
    logout,
  }
}
