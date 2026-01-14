/**
 * OAuth configuration for Hypernative authentication.
 * Implements OAuth 2.0 Authorization Code Flow with PKCE (RFC 7636)
 * as specified in Hypernative API documentation.
 *
 * All values can be overridden via environment variables.
 */

import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/config/constants'

/**
 * OAuth configuration object
 */
export const HYPERNATIVE_OAUTH_CONFIG = {
  /**
   * OAuth authorization endpoint (Step 1 of OAuth flow)
   * User is redirected here to authorize the application
   * Production: https://api.hypernative.xyz/oauth/authorize
   */
  authUrl: `${HYPERNATIVE_API_BASE_URL}/oauth/authorize`,

  /**
   * OAuth client ID
   * Identifies this application to Hypernative OAuth server
   * Production value: SAFE_WALLET_WEB
   */
  clientId: process.env.NEXT_PUBLIC_HYPERNATIVE_CLIENT_ID || 'SAFE_WALLET_WEB',

  /**
   * OAuth redirect URI
   * Where Hypernative redirects after user authorizes
   * Defaults to empty string - will be set dynamically based on window.location.origin
   * Must be pre-registered with Hypernative
   */
  redirectUri: process.env.NEXT_PUBLIC_HYPERNATIVE_REDIRECT_URI || '',
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

  return typeof window !== 'undefined' ? `${window.location.origin}${OAUTH_CALLBACK_ROUTE}` : OAUTH_CALLBACK_ROUTE
}
