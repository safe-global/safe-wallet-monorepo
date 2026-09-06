import Cookies from 'js-cookie'

/**
 * Cookie key for storing OAuth authentication data
 * Stores both token and expiry as JSON: { token: string, expiry: number }
 */
const AUTH_COOKIE_KEY = 'hn_auth'

/**
 * Authentication data structure stored in cookie
 *
 * refreshToken/refreshExpiry are absent for a cookie written before refresh support existed
 * (or for a session with no refresh grant, e.g. mock auth) - callers must treat that as
 * "no refresh available" rather than throwing.
 */
interface AuthTokenData {
  token: string
  tokenType: string
  expiry: number // access token expiry, timestamp in milliseconds
  refreshToken?: string
  refreshExpiry?: number // absolute end of the refresh window, timestamp in milliseconds
}

/**
 * Cookie options for secure OAuth token storage
 * - Secure: Only sent over HTTPS (when available)
 * - SameSite: Lax - protects against CSRF while allowing OAuth redirects
 * - Path: Root path so it's accessible across the app
 * - Expires: Set based on token expiry time
 *
 * SECURITY NOTE: This implementation uses client-side accessible cookies (not httpOnly)
 * because:
 * 1. The OAuth callback is handled client-side (Next.js page component)
 * 2. The token must be readable by JavaScript for expiration checking and cross-tab sync
 * 3. Client-side JavaScript cannot set httpOnly cookies - only servers can via Set-Cookie headers
 */
const getCookieOptions = (maxAgeInSeconds?: number): Cookies.CookieAttributes => {
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  return {
    secure: isSecure,
    sameSite: 'lax', // Use 'lax' for OAuth compatibility (allows redirects)
    path: '/',
    ...(maxAgeInSeconds && { expires: maxAgeInSeconds / (24 * 60 * 60) }), // Convert seconds to days
  }
}

/**
 * Helper function to get and parse auth cookie data
 * Handles expiration checks and cleanup of expired/invalid cookies.
 *
 * The cookie is only cleared once the refresh window (refreshExpiry) has closed - an expired
 * access token alongside a live refresh window is a normal, recoverable state. A cookie with no
 * refresh token (legacy, or no refresh grant) falls back to clearing on the access token expiry.
 * @returns Parsed auth token data or undefined if not found, expired, or invalid
 */
export const getAuthCookieData = (): AuthTokenData | undefined => {
  const cookieValue = Cookies.get(AUTH_COOKIE_KEY)
  if (!cookieValue) {
    return undefined
  }

  try {
    const data: AuthTokenData = JSON.parse(cookieValue)
    const hasRefresh = !!data.refreshToken && data.refreshExpiry !== undefined
    const clearAt = hasRefresh ? data.refreshExpiry : data.expiry
    if (Date.now() >= clearAt!) {
      // Refresh window (or access token, if there is no refresh) expired, clean up cookie
      clearAuthCookie()
      return undefined
    }
    return data
  } catch (error) {
    // Invalid JSON, clear corrupted cookie
    clearAuthCookie()
    return undefined
  }
}

/**
 * Set OAuth token in secure cookie
 * @param token - OAuth access token
 * @param tokenType - OAuth token type (e.g. 'Bearer')
 * @param expiresIn - Access token lifetime in seconds
 * @param refreshToken - Rotating refresh token, if the server granted one
 * @param refreshExpiresIn - Seconds left in the absolute refresh window (not reset by rotation)
 */
export const setAuthCookie = (
  token: string,
  tokenType: string,
  expiresIn: number,
  refreshToken?: string,
  refreshExpiresIn?: number,
): void => {
  const expiry = Date.now() + expiresIn * 1000
  const hasRefresh = !!refreshToken && refreshExpiresIn !== undefined
  const data: AuthTokenData = {
    token,
    tokenType,
    expiry,
    ...(hasRefresh && { refreshToken, refreshExpiry: Date.now() + refreshExpiresIn! * 1000 }),
  }
  // The cookie must outlive the access token whenever a refresh window is open, otherwise the
  // refresh token stored inside it is lost before it can ever be used.
  const cookieMaxAgeSeconds = hasRefresh ? refreshExpiresIn! : expiresIn
  Cookies.set(AUTH_COOKIE_KEY, JSON.stringify(data), getCookieOptions(cookieMaxAgeSeconds))
}

/**
 * Clear OAuth token cookie (logout)
 */
export const clearAuthCookie = (): void => {
  Cookies.remove(AUTH_COOKIE_KEY, { path: '/' })
}
