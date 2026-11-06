import { getAuthCookieData, setAuthCookie, type AuthTokens } from '../store/cookieStorage'

export const REFRESH_MARGIN_MS = 60_000

// The server accepts a repeated refresh token for 30s; a repeat after that revokes the whole chain
export const REFRESH_RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000]

// setTimeout overflows above a signed 32-bit delay and fires at once
export const MAX_TIMEOUT_DELAY_MS = 2 ** 31 - 1

const REFRESH_LOCK_NAME = 'hypernative-auth-refresh'

// RFC 6749 §5.2 codes after which only a new sign-in helps
const TERMINAL_OAUTH_ERRORS = ['invalid_grant', 'invalid_client', 'unsupported_grant_type', 'invalid_request']

export type RefreshOutcome = 'refreshed' | 'superseded' | 'abandoned' | 'terminal' | 'transient'

export type RefreshStep =
  | { type: 'done' }
  | { type: 'sign-out' }
  | { type: 'retry'; delayMs: number }
  | { type: 'abandon' }
  | { type: 'wait-for-online' }

export type ExchangeRefreshToken = (refreshToken: string) => Promise<AuthTokens>

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

/**
 * Reads the OAuth error code from a failed token request.
 * The API sends it nested at `error.error` for a 4xx and flat at `error` for a 5xx.
 * @param rejection - The value the request rejected with
 * @returns The error code, or undefined when the response carries none
 */
export const getOAuthErrorCode = (rejection: unknown): string | undefined => {
  if (!isRecord(rejection)) {
    return undefined
  }
  const { error } = rejection
  if (typeof error === 'string') {
    return error
  }
  return isRecord(error) && typeof error.error === 'string' ? error.error : undefined
}

/**
 * Decides what to do after a refresh attempt.
 * @param outcome - The result of the attempt
 * @param attempt - Zero-based number of the attempt that produced the outcome
 * @param isOnline - Whether the browser was online when the attempt failed
 * @returns The next step for the scheduler
 */
export const getNextRefreshStep = (outcome: RefreshOutcome, attempt: number, isOnline: boolean): RefreshStep => {
  if (outcome === 'terminal') {
    return { type: 'sign-out' }
  }
  if (outcome !== 'transient') {
    return { type: 'done' }
  }

  const delayMs = REFRESH_RETRY_DELAYS_MS[attempt]
  if (delayMs !== undefined) {
    return { type: 'retry', delayMs }
  }
  // Offline requests never reached the server, so the token is still unused
  return isOnline ? { type: 'abandon' } : { type: 'wait-for-online' }
}

/**
 * @param expiry - Access token expiry, timestamp in milliseconds
 * @param now - Current timestamp in milliseconds
 * @returns Milliseconds until the refresh is due, clamped to what setTimeout accepts
 */
export const getRefreshDelayMs = (expiry: number, now: number): number =>
  Math.min(Math.max(expiry - REFRESH_MARGIN_MS - now, 0), MAX_TIMEOUT_DELAY_MS)

const runRefresh = async (refreshToken: string, exchange: ExchangeRefreshToken): Promise<RefreshOutcome> => {
  const current = getAuthCookieData()
  if (current?.refreshToken !== refreshToken) {
    return 'superseded'
  }
  if (current.refreshAbandoned) {
    return 'abandoned'
  }

  try {
    setAuthCookie(await exchange(refreshToken))
    return 'refreshed'
  } catch (rejection) {
    const code = getOAuthErrorCode(rejection)
    return code !== undefined && TERMINAL_OAUTH_ERRORS.includes(code) ? 'terminal' : 'transient'
  }
}

/**
 * Exchanges the refresh token for a new token pair and stores it.
 * Runs under a Web Lock, so a second tab reads the rotated token instead of sending a used one.
 * @param refreshToken - The refresh token the caller scheduled the refresh for
 * @param exchange - Sends the refresh grant to the OAuth server
 * @returns What happened, without acting on failures
 */
export const refreshAuthToken = async (
  refreshToken: string,
  exchange: ExchangeRefreshToken,
): Promise<RefreshOutcome> => {
  if (!navigator.locks) {
    return runRefresh(refreshToken, exchange)
  }
  return await navigator.locks.request(REFRESH_LOCK_NAME, () => runRefresh(refreshToken, exchange))
}
