/**
 * Utilities for detecting and handling specific transaction errors
 */
import { BaseError } from 'viem'
import { RpcRetryExhaustedError } from '@/utils/providers/RetryingRpcProvider'

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

const RATE_LIMIT_MESSAGE_RE = /rate.?limit|too many requests|throttle/i

/**
 * Detects if an error originated from a transient RPC rate-limit (HTTP 429
 * or JSON-RPC -32005/-32603) after our `RetryingRpcProvider` exhausted its
 * built-in retries, OR a viem-wrapped contract error whose cause chain
 * carries the same signals.
 */
export const isRateLimitError = (error: unknown): boolean => {
  if (error instanceof RpcRetryExhaustedError) return true

  if (error instanceof BaseError) {
    const match = error.walk((e) => {
      const code = (e as { code?: unknown } | null)?.code
      const status = (e as { status?: unknown } | null)?.status
      return code === -32005 || code === -32603 || status === 429
    })
    if (match) return true
  }

  const message = (error as { message?: unknown } | null)?.message
  return typeof message === 'string' && RATE_LIMIT_MESSAGE_RE.test(message)
}
