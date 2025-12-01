import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectIsAuthenticated, selectIsTokenExpired, setAuthToken, clearAuthToken } from '../store/hnAuthSlice'
import { HYPERNATIVE_OAUTH_CONFIG, MOCK_AUTH_ENABLED, getRedirectUri } from '../config/oauth'

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
 * PKCE code verifier key in sessionStorage
 * The code verifier is a cryptographically random string used in PKCE flow.
 * It's stored temporarily during OAuth flow and retrieved by the callback page.
 */
const PKCE_VERIFIER_KEY = 'hn_pkce_verifier'

/**
 * OAuth state parameter key in sessionStorage
 * The state parameter is used for CSRF protection in OAuth flows.
 * It's verified in the callback to ensure the response matches the request.
 */
const OAUTH_STATE_KEY = 'hn_oauth_state'

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
 * Length of PKCE code verifier string (43-128 characters per RFC 7636)
 * Using 128 for maximum entropy
 */
const PKCE_VERIFIER_LENGTH = 128

/**
 * Length of OAuth state parameter (recommended minimum 32 characters)
 */
const OAUTH_STATE_LENGTH = 32

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
 * Generate a random string for PKCE code verifier or OAuth state
 * Uses crypto.getRandomValues for cryptographically secure randomness
 * @param length - Length of the random string to generate
 * @returns Random string containing URL-safe characters
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  return Array.from(randomValues)
    .map((value) => charset[value % charset.length])
    .join('')
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

  // Generate PKCE code verifier and challenge
  const codeVerifier = generateRandomString(PKCE_VERIFIER_LENGTH)
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  // Generate OAuth state parameter for CSRF protection
  const state = generateRandomString(OAUTH_STATE_LENGTH)

  // Store verifier and state in sessionStorage for callback page
  sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier)
  sessionStorage.setItem(OAUTH_STATE_KEY, state)

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
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isTokenExpired = useAppSelector(selectIsTokenExpired)
  const [loading, setLoading] = useState(false)

  // Reference to popup window for cleanup
  const popupRef = useRef<Window | null>(null)

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
        const { token, expiresIn } = event.data
        if (token && expiresIn) {
          dispatch(setAuthToken({ token, expiresIn }))
        }
        setLoading(false)

        // Close popup if it's still open
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close()
        }
      }

      // Handle authentication error
      if (event.data?.type === HN_AUTH_ERROR_EVENT) {
        console.error('Hypernative OAuth error:', event.data.error)
        setLoading(false)

        // Close popup if it's still open
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close()
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [dispatch])

  /**
   * Initiate OAuth login flow
   * - In mock mode: immediately set a mock token
   * - In real mode: open popup/tab with OAuth authorization URL
   */
  const initiateLogin = useCallback(async () => {
    setLoading(true)

    try {
      // Mock authentication for development
      if (MOCK_AUTH_ENABLED) {
        // Simulate async token exchange
        await new Promise((resolve) => setTimeout(resolve, MOCK_AUTH_DELAY_MS))

        const mockToken = `mock-token-${Date.now()}`
        dispatch(setAuthToken({ token: mockToken, expiresIn: MOCK_TOKEN_EXPIRES_IN }))
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

      if (!popup || popup.closed) {
        // Popup blocked - fallback to new tab
        window.open(authUrl, '_blank')
      } else {
        // Store popup reference to close it later
        popupRef.current = popup
      }
    } catch (error) {
      console.error('Failed to initiate Hypernative OAuth:', error)
      setLoading(false)
    }
  }, [dispatch])

  /**
   * Logout - clear authentication token
   */
  const logout = useCallback(() => {
    dispatch(clearAuthToken())
  }, [dispatch])

  return {
    isAuthenticated,
    isTokenExpired,
    loading,
    initiateLogin,
    logout,
  }
}
