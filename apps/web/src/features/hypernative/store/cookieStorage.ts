import Cookies from 'js-cookie'

/**
 * Cookie key for storing OAuth authentication data
 * Stores both token and expiry as JSON: { token: string, expiry: number }
 */
const AUTH_COOKIE_KEY = 'hn_auth'

/**
 * Authentication data structure stored in cookie
 */
interface AuthTokenData {
  token: string
  expiry: number // timestamp in milliseconds
}

/**
 * Cookie options for secure OAuth token storage
 * - Secure: Only sent over HTTPS (when available)
 * - SameSite: Lax - protects against CSRF while allowing OAuth redirects
 * - Path: Root path so it's accessible across the app
 * - Expires: Set based on token expiry time
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
 * Handles expiration checks and cleanup of expired/invalid cookies
 * @returns Parsed auth token data or undefined if not found, expired, or invalid
 */
const getAuthCookieData = (): AuthTokenData | undefined => {
  const cookieValue = Cookies.get(AUTH_COOKIE_KEY)
  if (!cookieValue) {
    return undefined
  }

  try {
    const data: AuthTokenData = JSON.parse(cookieValue)
    if (Date.now() >= data.expiry) {
      // Token expired, clean up cookie
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
 * @param expiresIn - Token lifetime in seconds
 */
export const setAuthCookie = (token: string, expiresIn: number): void => {
  const expiry = Date.now() + expiresIn * 1000
  const data: AuthTokenData = { token, expiry }
  Cookies.set(AUTH_COOKIE_KEY, JSON.stringify(data), getCookieOptions(expiresIn))
}

/**
 * Get OAuth token from cookie if available and not expired
 * @returns Token string or undefined if not found or expired
 */
export const getAuthToken = (): string | undefined => {
  const data = getAuthCookieData()
  return data?.token
}

/**
 * Get token expiry timestamp from cookie
 * @returns Expiry timestamp in milliseconds or undefined if not found or expired
 */
export const getAuthExpiry = (): number | undefined => {
  const data = getAuthCookieData()
  return data?.expiry
}

/**
 * Check if user is authenticated (has valid, non-expired token)
 * @returns true if authenticated, false otherwise
 */
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== undefined
}

/**
 * Check if token is expired
 * @returns true if expired or missing, false if valid
 */
export const isExpired = (): boolean => {
  const expiry = getAuthExpiry()
  return expiry === undefined
}

/**
 * Clear OAuth token cookie (logout)
 */
export const clearAuthCookie = (): void => {
  Cookies.remove(AUTH_COOKIE_KEY, { path: '/' })
}
