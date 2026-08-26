import {
  CONTRACT_ERROR_FALLBACK,
  getContractErrorMessage,
  getGsCodeFromError,
} from '@safe-global/utils/services/exceptions/contractErrors'

/**
 * A failure the user is allowed to read. `message` is always copy we own —
 * never a library message, a function signature, calldata or a GS code — so it
 * can be routed straight to `/execution-error` or a toast.
 *
 * The original throwable stays on `cause` for logging only.
 */
export class ExecutionError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'ExecutionError'
    this.cause = cause
  }
}

export const isExecutionError = (error: unknown): error is ExecutionError => error instanceof ExecutionError

export const getInsufficientFeeFundsMessage = (nativeAsset?: string): string =>
  `Not enough ${nativeAsset ?? 'funds'} in your signer wallet to cover the network fee. Add funds and try again.`

/** Keys viem and ethers hang identifying or human-readable text off. */
const TEXT_KEYS = ['code', 'shortMessage', 'details', 'reason', 'message'] as const

const MAX_CAUSE_DEPTH = 10

/**
 * viem and ethers both nest the real failure several `cause` levels below the
 * error we catch, and spread the useful text across different keys. Collect all
 * of it into one blob so the matchers below only have to look in one place.
 */
const collectErrorText = (error: unknown): string => {
  const parts: string[] = []
  let current: unknown = error

  for (let depth = 0; depth < MAX_CAUSE_DEPTH && current != null; depth++) {
    if (typeof current === 'string') {
      parts.push(current)
      break
    }
    if (typeof current !== 'object') {
      break
    }

    const record = current as Record<string, unknown>
    const name = record.name
    if (typeof name === 'string') {
      parts.push(name)
    }
    for (const key of TEXT_KEYS) {
      const value = record[key]
      if (typeof value === 'string') {
        parts.push(value)
      }
    }
    current = record.cause
  }

  return parts.join('\n')
}

/** viem's `total cost (gas * gas fee + value) ... exceeds balance`, plus the ethers/RPC wordings. */
const INSUFFICIENT_FUNDS_PATTERNS = [
  /total cost \(gas \* gas fee \+ value\)/i,
  /InsufficientFundsError/,
  /insufficient funds/i,
  /\bINSUFFICIENT_FUNDS\b/,
]

/**
 * Markers that the throwable is a contract-execution failure from the web3
 * stack. Anything matching here must never be shown verbatim, even when we
 * cannot pin down a specific cause.
 */
const CONTRACT_ERROR_PATTERNS = [
  /ContractFunctionExecutionError/,
  /ContractFunctionRevertedError/,
  /CallExecutionError/,
  /TransactionExecutionError/,
  /EstimateGasExecutionError/,
  /execution reverted/i,
  /reverted with (the following )?reason/i,
  /\bCALL_EXCEPTION\b/,
  /\bUNPREDICTABLE_GAS_LIMIT\b/,
]

const matchesAny = (patterns: RegExp[], text: string): boolean => patterns.some((pattern) => pattern.test(text))

/**
 * A GS message may carry `{nativeAsset}` / `{token}` placeholders. We only know
 * the native asset at this point, so a message that still has an unresolved
 * placeholder is downgraded to the shared fallback rather than leaking braces.
 */
const hasUnresolvedPlaceholder = (message: string): boolean => /\{\w+\}/.test(message)

export interface ClassifyExecutionErrorParams {
  /** Native currency symbol of the executing chain, e.g. "ETH". */
  nativeAsset?: string
}

/**
 * Turn a thrown execution failure into an `ExecutionError` carrying copy from
 * the shared Safe contract-error source.
 *
 * Returns `undefined` when the throwable is not a web3 execution failure (an
 * app-level error such as a missing private key, or a typed relay-simulation
 * error the caller branches on) so the existing handling stays in charge.
 */
export const classifyExecutionError = (
  error: unknown,
  { nativeAsset }: ClassifyExecutionErrorParams = {},
): ExecutionError | undefined => {
  // Pre-checks already resolved a specific cause; keep their message.
  if (isExecutionError(error)) {
    return error
  }

  const text = collectErrorText(error)
  if (!text) {
    return undefined
  }

  // A GS code is the most specific signal available, so it wins over the
  // generic wallet-balance wording a provider may add alongside it.
  const gsCode = getGsCodeFromError({ message: text })
  if (gsCode) {
    const message = getContractErrorMessage(gsCode, { nativeAsset })
    return new ExecutionError(hasUnresolvedPlaceholder(message) ? CONTRACT_ERROR_FALLBACK : message, error)
  }

  if (matchesAny(INSUFFICIENT_FUNDS_PATTERNS, text)) {
    return new ExecutionError(getInsufficientFeeFundsMessage(nativeAsset), error)
  }

  if (matchesAny(CONTRACT_ERROR_PATTERNS, text)) {
    return new ExecutionError(CONTRACT_ERROR_FALLBACK, error)
  }

  return undefined
}
