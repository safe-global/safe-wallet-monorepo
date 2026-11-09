import Cookies from 'js-cookie'
import type { HypernativeTokenExchangeResponseDto } from '@safe-global/store/hypernative/hypernativeApi.dto'

/**
 * Cookie key for storing OAuth authentication data
 * Stores both token and expiry as JSON: { token: string, expiry: number }
 */
const AUTH_COOKIE_KEY = 'hn_auth'

/** Fired on the window whenever this tab writes or clears the auth cookie */
export const AUTH_COOKIE_CHANGE_EVENT = 'hn-auth-cookie-change'

export type AuthTokens = Pick<
  HypernativeTokenExchangeResponseDto['data'],
  'access_token' | 'token_type' | 'expires_in' | 'refresh_token' | 'refresh_expires_in'
>

/**
 * Authentication data structure stored in cookie
 */
export interface AuthTokenData {
  token: string
  tokenType: string
  expiry: number // timestamp in milliseconds
  refreshToken?: string
  refreshExpiry?: number // end of the absolute refresh window, timestamp in milliseconds
  refreshAbandoned?: boolean
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

const notifyAuthCookieChange = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_COOKIE_CHANGE_EVENT))
  }
}

const writeAuthCookie = (data: AuthTokenData, maxAgeInSeconds: number): void => {
  Cookies.set(AUTH_COOKIE_KEY, JSON.stringify(data), getCookieOptions(maxAgeInSeconds))
  notifyAuthCookieChange()
}

/**
 * Helper function to get and parse auth cookie data
 * Handles expiration checks and cleanup of expired/invalid cookies.
 * A cookie with a usable refresh token lives until both tokens have expired.
 * @returns Parsed auth token data or undefined if not found, expired, or invalid
 */
export const getAuthCookieData = (): AuthTokenData | undefined => {
  const cookieValue = Cookies.get(AUTH_COOKIE_KEY)
  if (!cookieValue) {
    return undefined
  }

  try {
    const data: AuthTokenData = JSON.parse(cookieValue)
    const refreshExpiry = data.refreshToken && !data.refreshAbandoned ? data.refreshExpiry : undefined
    const clearAt = refreshExpiry === undefined ? data.expiry : Math.max(data.expiry, refreshExpiry)
    if (Date.now() >= clearAt) {
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
 * Set OAuth tokens in secure cookie
 * @param tokens - The token response from the OAuth server
 */
export const setAuthCookie = ({
  access_token,
  token_type,
  expires_in,
  refresh_token,
  refresh_expires_in,
}: AuthTokens): void => {
  const now = Date.now()
  const data: AuthTokenData = { token: access_token, tokenType: token_type, expiry: now + expires_in * 1000 }

  if (refresh_token && refresh_expires_in !== undefined) {
    data.refreshToken = refresh_token
    data.refreshExpiry = now + refresh_expires_in * 1000
    // Near the end of the refresh window the refresh token can expire before the access token
    writeAuthCookie(data, Math.max(expires_in, refresh_expires_in))
    return
  }

  writeAuthCookie(data, expires_in)
}

/**
 * @param data - The auth cookie data
 * @returns The refresh token, or undefined when it is missing, abandoned or past its window
 */
export const getUsableRefreshToken = (data: AuthTokenData): string | undefined => {
  if (!data.refreshToken || data.refreshAbandoned || data.refreshExpiry === undefined) {
    return undefined
  }
  return Date.now() < data.refreshExpiry ? data.refreshToken : undefined
}

/**
 * Stop the refresh token from ever being sent again. Does nothing if another tab already rotated it.
 * @param refreshToken - The refresh token whose retries were spent
 */
export const markRefreshAbandoned = (refreshToken: string): void => {
  const data = getAuthCookieData()
  if (!data || data.refreshToken !== refreshToken) {
    return
  }
  writeAuthCookie({ ...data, refreshAbandoned: true }, (data.expiry - Date.now()) / 1000)
}

/**
 * Clear OAuth token cookie (logout)
 */
export const clearAuthCookie = (): void => {
  Cookies.remove(AUTH_COOKIE_KEY, { path: '/' })
  notifyAuthCookieChange()
}
