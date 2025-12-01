/**
 * OAuth configuration for Hypernative authentication.
 * Implements OAuth 2.0 Authorization Code Flow with PKCE (RFC 7636)
 * as specified in Hypernative API documentation.
 *
 * All values can be overridden via environment variables.
 */

/**
 * OAuth configuration object
 */
export const HYPERNATIVE_OAUTH_CONFIG = {
  /**
   * OAuth authorization endpoint (Step 1 of OAuth flow)
   * User is redirected here to authorize the application
   * Production: https://api.hypernative.io/oauth/authorize
   */
  authUrl: process.env.NEXT_PUBLIC_HYPERNATIVE_AUTH_URL || 'https://mock-hn-auth.example.com/oauth/authorize',

  /**
   * OAuth token exchange endpoint (Step 2 of OAuth flow)
   * Used to exchange authorization code for access token
   * Production: https://api.hypernative.io/oauth/token
   */
  tokenUrl: process.env.NEXT_PUBLIC_HYPERNATIVE_TOKEN_URL || 'https://mock-hn-auth.example.com/oauth/token',

  /**
   * Hypernative API base URL
   * Used for threat analysis and other API calls
   * Production: https://api.hypernative.io
   */
  apiBaseUrl: process.env.NEXT_PUBLIC_HYPERNATIVE_API_URL || 'https://mock-hn-api.example.com',

  /**
   * OAuth client ID
   * Identifies this application to Hypernative OAuth server
   * Production value: SAFE_WALLET_SPA
   */
  clientId: process.env.NEXT_PUBLIC_HYPERNATIVE_CLIENT_ID || 'SAFE_WALLET_SPA',

  /**
   * OAuth redirect URI
   * Where Hypernative redirects after user authorizes
   * Defaults to empty string - will be set dynamically based on window.location.origin
   * Must be pre-registered with Hypernative
   */
  redirectUri: process.env.NEXT_PUBLIC_HYPERNATIVE_REDIRECT_URI || '',

  /**
   * OAuth scopes
   * Permissions requested from the user
   * Hypernative OAuth tokens are read-only by default
   */
  scope: 'read',
} as const

/**
 * OAuth callback route path
 * This is where Hypernative redirects after authorization
 */
export const OAUTH_CALLBACK_ROUTE = '/hypernative/oauth-callback'

/**
 * Flag to enable mocked authentication flow
 * When true, uses mocked endpoints and simplified flow
 */
export const MOCK_AUTH_ENABLED = process.env.NEXT_PUBLIC_HN_MOCK_AUTH === 'true'

/**
 * Get the full redirect URI
 * Combines the current origin with the callback route
 * Falls back to configured redirectUri if window is not available (SSR)
 */
export const getRedirectUri = (): string => {
  if (HYPERNATIVE_OAUTH_CONFIG.redirectUri) {
    return HYPERNATIVE_OAUTH_CONFIG.redirectUri
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}${OAUTH_CALLBACK_ROUTE}`
  }

  // Fallback for SSR
  return OAUTH_CALLBACK_ROUTE
}
