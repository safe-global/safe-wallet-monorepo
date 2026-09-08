/**
 * Utilities for detecting and handling specific transaction errors
 */
import { BaseError } from 'viem'
import { getKnownCustomError, HYPERNATIVE_GUARD_SOURCE } from '@/utils/customErrorRegistry'
import { isRevertError } from '@safe-global/utils/services/exceptions/contractErrors'

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
  return getKnownCustomError(errorCode)?.name ?? 'Unknown'
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
 * Detects a Hypernative guard revert — its `UnapprovedHash` custom error, thrown
 * while a transaction is still awaiting approval in the owner's Hypernative account.
 */
export const isHypernativeGuardRevert = (error: Error): boolean => {
  const code = extractGuardErrorCode(error)
  return !!code && getKnownCustomError(code)?.source === HYPERNATIVE_GUARD_SOURCE
}

/**
 * User-facing message shown wherever a transient RPC rate-limit surfaces
 * (transaction notification toast, inline submit-error in ComboSubmit, etc.).
 * Kept as a single constant so the same condition reads consistently
 * regardless of which catch handler reached the UI first.
 */
export const RATE_LIMIT_USER_MESSAGE = 'Network is busy. Please try again in a moment.'

/** Shown wherever the Hypernative guard blocks execution: inline in the tx flow and in the toast. */
export const HYPERNATIVE_APPROVAL_REQUIRED_MESSAGE =
  'This transaction is awaiting approval in your Hypernative account.'

/** JSON-RPC LimitExceeded. -32603 (Internal) is deliberately excluded: a real eth_call failure surfaces as -32603. */
const RPC_LIMIT_EXCEEDED = -32005

const isViemRateLimitError = (error: unknown): boolean =>
  error instanceof BaseError &&
  !!error.walk((e) => {
    const { code, status } = (e ?? {}) as { code?: unknown; status?: unknown }
    return code === RPC_LIMIT_EXCEEDED || status === 429
  })

/**
 * ethers wraps the same two signals in shapes of its own: an HTTP 429 becomes a
 * `SERVER_ERROR` carrying the `FetchResponse`, and -32005 lands on the nested
 * JSON-RPC error — under `error` for most methods, under `info.error` for
 * `eth_call`/`eth_estimateGas`, which ethers first misclassifies as a revert.
 */
const isEthersRateLimitError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false

  const err = error as {
    code?: unknown
    error?: { code?: unknown }
    info?: { error?: { code?: unknown } }
    response?: { statusCode?: unknown; statusMessage?: unknown }
  }

  if (err.error?.code === RPC_LIMIT_EXCEEDED || err.info?.error?.code === RPC_LIMIT_EXCEEDED) return true
  if (err.code !== 'SERVER_ERROR') return false

  const { statusCode, statusMessage } = err.response ?? {}
  if (statusCode === 429) return true

  // ethers retries a 429 itself and, once its retry budget is spent, escalates
  // it to a synthetic 599 that quotes the original status in its message.
  return statusCode === 599 && typeof statusMessage === 'string' && /\b429\b/.test(statusMessage)
}

/**
 * Detects a transient RPC rate-limit (JSON-RPC -32005 / HTTP 429) from either
 * client. Both viem's `http()` transport and ethers' `FetchRequest` retry these
 * with backoff, so this only decides whether to show the friendly message once
 * the retries are spent and the error reaches the UI.
 *
 * Matched on structured shapes only. A message-text regex would false-positive
 * on contract reverts like `require(..., "rate limit exceeded")`, telling users
 * to retry a transaction guaranteed to fail on-chain.
 */
export const isRateLimitError = (error: unknown): boolean =>
  isViemRateLimitError(error) || isEthersRateLimitError(error)

/**
 * Detects a wallet-level (EOA) nonce conflict rejected by the RPC pre-mining
 * (no gas spent): the signer account's Ethereum nonce was already consumed
 * ("nonce too low" — another tx from the same wallet mined first) or is still
 * occupied by a pending tx that the new one doesn't outbid ("replacement
 * transaction underpriced" / "already known"). Matched on the RPC error text
 * (viem wraps these misleadingly as contract reverts) plus ethers' structured
 * codes.
 */
export const isNonceTooLowError = (error: unknown): boolean => {
  if (!error) return false

  const err = error as { code?: unknown; message?: string }

  if (err.code === 'NONCE_EXPIRED' || err.code === 'REPLACEMENT_UNDERPRICED') return true

  return (
    typeof err.message === 'string' &&
    /nonce too low|nonce has already been used|replacement transaction underpriced|already known/i.test(err.message)
  )
}

export { isRevertError }

/**
 * A gas estimate that reverts or is throttled is an expected outcome the UI
 * already answers, not a fault worth a coded log.
 */
export const isExpectedEstimationError = (error: unknown): boolean => isRevertError(error) || isRateLimitError(error)
