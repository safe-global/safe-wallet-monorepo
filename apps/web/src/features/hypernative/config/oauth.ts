/**
 * OAuth configuration for Hypernative authentication.
 * Uses mocked endpoints for development until real HN OAuth endpoints are provided.
 * All values can be overridden via environment variables.
 */

/**
 * OAuth configuration object
 */
export const HYPERNATIVE_OAUTH_CONFIG = {
  /**
   * OAuth authorization endpoint (Step 1 of OAuth flow)
   * User is redirected here to authorize the application
   */
  authUrl: process.env.NEXT_PUBLIC_HYPERNATIVE_AUTH_URL || 'https://mock-hn-auth.example.com/oauth/authorize',

  /**
   * OAuth token exchange endpoint (Step 2 of OAuth flow)
   * Used to exchange authorization code for access token
   */
  tokenUrl: process.env.NEXT_PUBLIC_HYPERNATIVE_TOKEN_URL || 'https://mock-hn-auth.example.com/oauth/token',

  /**
   * Hypernative API base URL
   * Used for threat analysis and other API calls
   */
  apiBaseUrl: process.env.NEXT_PUBLIC_HYPERNATIVE_API_URL || 'https://mock-hn-api.example.com',

  /**
   * OAuth client ID
   * Identifies this application to Hypernative OAuth server
   */
  clientId: process.env.NEXT_PUBLIC_HYPERNATIVE_CLIENT_ID || 'mock-client-id',

  /**
   * OAuth redirect URI
   * Where Hypernative redirects after user authorizes
   * Defaults to empty string - will be set dynamically based on window.location.origin
   */
  redirectUri: process.env.NEXT_PUBLIC_HYPERNATIVE_REDIRECT_URI || '',

  /**
   * OAuth scopes
   * Permissions requested from the user
   */
  scope: 'read:analysis write:analysis',
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
