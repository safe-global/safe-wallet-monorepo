/**
 * Utilities for detecting and handling specific transaction errors
 */
import { BaseError } from 'viem'

/**
 * Guard error codes
 */
export const GUARD_ERROR_CODES = {
  UNAPPROVED_HASH: '0x70cc6907',
} as const

/**
 * Detects if an error is a Guard revert error and returns the error name
 * @param {Error} error - The error to check
 * @returns {string | undefined} The human-readable error name if it's a guard error, undefined otherwise
 */
export const getGuardErrorInfo = (error: Error): string | undefined => {
  const errorCode = extractGuardErrorCode(error)
  return errorCode ? getGuardErrorName(errorCode) : undefined
}

/**
 * Extracts the Guard error code from an error message
 * @param {Error} error - The error to extract from
 * @returns {string | undefined} The error code if found, undefined otherwise
 */
export const extractGuardErrorCode = (error: Error): string | undefined => {
  if (!error) return undefined

  const errorMessage = error.message || ''

  // Check for each known guard error code in the message
  for (const code of Object.values(GUARD_ERROR_CODES)) {
    if (errorMessage.includes(code)) {
      return code
    }
  }

  return undefined
}

/**
 * Gets a human-readable error name from a Guard error code
 * @param {string} errorCode - The error code (e.g., '0x70cc6907')
 * @returns {string} Human-readable error name
 */
export const getGuardErrorName = (errorCode: string): string => {
  switch (errorCode) {
    case GUARD_ERROR_CODES.UNAPPROVED_HASH:
      return 'UnapprovedHash'
    default:
      return 'Unknown'
  }
}

/**
 * Detects if an error is a Guard revert error
 * @param {Error} error - The error to check
 * @returns {boolean} true if the error is a Guard revert
 */
export const isGuardError = (error: Error): boolean => {
  return extractGuardErrorCode(error) !== undefined
}

/**
 * User-facing message shown wherever a transient RPC rate-limit surfaces
 * (transaction notification toast, inline submit-error in ComboSubmit, etc.).
 * Kept as a single constant so the same condition reads consistently
 * regardless of which catch handler reached the UI first.
 */
export const RATE_LIMIT_USER_MESSAGE = 'Network is busy. Please try again in a moment.'

/**
 * Detects if an error originated from a transient RPC rate-limit: a viem
 * error whose cause chain carries the documented throttle signals
 * (JSON-RPC -32005 / HTTP 429). viem's `http()` transport already retries
 * these with backoff; this guard only decides whether to show the friendly
 * message once retries are exhausted and the error reaches the UI.
 *
 * Intentionally only matches structured shapes (viem `BaseError` cause
 * chains carrying the expected `code`/`status`). A message-text regex would
 * false-positive on contract reverts like `require(..., "rate limit
 * exceeded")`, leading users to retry transactions guaranteed to fail
 * on-chain.
 */
export const isRateLimitError = (error: unknown): boolean => {
  if (error instanceof BaseError) {
    const match = error.walk((e) => {
      const code = (e as { code?: unknown } | null)?.code
      const status = (e as { status?: unknown } | null)?.status
      // Match only the documented throttle signals: JSON-RPC -32005
      // (LimitExceeded) and HTTP 429. -32603 (Internal) is intentionally NOT
      // matched — a real eth_call simulation failure can surface as -32603,
      // and translating it to "Network is busy" would prompt users to retry
      // guaranteed-failing transactions.
      return code === -32005 || status === 429
    })
    if (match) return true
  }

  return false
}
