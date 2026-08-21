/**
 * Utilities for detecting and handling specific transaction errors
 */
import { BaseError } from 'viem'
import { extractRevertSelector, getKnownCustomError } from '@/utils/customErrorRegistry'
import { getGsCodeFromError } from '@safe-global/utils/services/exceptions/contractErrors'

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

/**
 * Detects a revert that carries no reason anyone can decode.
 *
 * MultiSend and MultiSendCallOnly do `revert(0, 0)` when an inner call fails,
 * destroying the child's revert data. A failing batch therefore reaches us as a
 * bare `require(false)` with an empty payload: no GS code, no custom-error
 * selector, nothing to look up. The only honest thing we can tell the user is
 * that something in the transaction fails on-chain, and that splitting the
 * batch is what surfaces the real reason.
 *
 * Deliberately narrow — it demands positive proof that the payload is empty.
 * A revert with anything decodable (a GS code, an `Error(string)`, a module or
 * guard custom error) keeps its own specific message.
 */
export const isOpaqueRevertError = (error: unknown): boolean => {
  if (!isRevertError(error)) return false

  // Anything we can name is not opaque.
  if (getGsCodeFromError(error as { message?: string; reason?: string; code?: unknown })) return false
  if (extractRevertSelector(error)) return false

  const { data, message } = error as { data?: unknown; message?: string }

  // ethers: an empty revert payload, reported either structurally or in text
  if (data === '0x') return true

  // viem: `ExecutionRevertedError` folds the missing reason into its message
  // ("Execution reverted for an unknown reason.") rather than a field. It is
  // the shape the protocol-kit execution paths throw, where ethers' never
  // reach us.
  return typeof message === 'string' && /no data present|require\(false\)|for an unknown reason/i.test(message)
}

/**
 * The `Error(string)` selector: a plain `require(cond, "reason")` revert, which
 * ethers and viem both decode into a human sentence on the error itself.
 */
const STRING_REVERT_SELECTOR = '0x08c379a0'

/**
 * What may be shown behind "Details" for an error — the one rule both the toast
 * and the inline alert follow, so the two surfaces cannot drift (WA-3267).
 *
 * A revert never gets its raw message: that string is the ethers/viem dump,
 * carrying calldata, contract addresses and the library version (WA-3005 #6).
 * What survives is what we can name — the GS code, or a decoded
 * `Error(string)` reason, which the chain wrote for a human to read. Anything
 * else gets no Details at all rather than an empty one.
 *
 * Non-revert errors keep their message: those are usually sentences we wrote
 * ourselves (a relay timeout, "transaction not found") and are the only
 * explanation the user gets.
 */
export const getErrorReference = (error: Error): string | undefined => {
  if (!isRevertError(error)) return error.message

  const gsCode = getGsCodeFromError(error)
  if (gsCode) return `Error code ${gsCode}`

  if (extractRevertSelector(error) === STRING_REVERT_SELECTOR) {
    const { reason } = error as Error & { reason?: string }
    return reason || undefined
  }
}

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

/**
 * Detects whether an error is a genuine on-chain revert — i.e. a node told us
 * the transaction reverts — as opposed to an infrastructure failure (RPC down,
 * timeout, rate-limit) where we simply could not complete the check.
 *
 * Only a decodable revert signal counts: a known GS code, an ethers
 * `CALL_EXCEPTION`, or an "execution reverted" message. Everything else is
 * treated as infra — the safe default, so we never claim a transaction will
 * fail unless a node actually reverted it (WA-3005 guideline #2).
 */
export const isRevertError = (error: unknown): boolean => {
  if (!error) return false

  const err = error as { code?: unknown; reason?: string; message?: string }

  // A known GS revert reason is definitive.
  if (getGsCodeFromError(err)) return true

  // ethers marks a reverted eth_call/estimateGas as CALL_EXCEPTION.
  if (err.code === 'CALL_EXCEPTION') return true

  // viem/ethers revert text.
  if (typeof err.message === 'string' && /execution reverted|reverted with/i.test(err.message)) return true

  return false
}
