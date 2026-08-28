import {
  CONTRACT_ERROR_FALLBACK,
  getContractErrorMessage,
  getGsCodeFromError,
  type GsCode,
} from '@safe-global/utils/services/exceptions/contractErrors'
import { RelaySimulationError } from '@safe-global/utils/services/relayErrors'

/**
 * A failure the user is allowed to read. `message` is always copy we own —
 * never a library message, a function signature, calldata or a GS code — so it
 * can be routed straight to `/execution-error` or a toast.
 *
 * `code` is the GS code behind the failure, when known. It is a support
 * reference only: the UI renders it next to the message, never inside it. The
 * shared fallback copy points at that reference, so any error carrying the
 * fallback must also carry a code.
 *
 * The original throwable stays on `cause` for logging only.
 */
export class ExecutionError extends Error {
  readonly code?: GsCode

  constructor(message: string, options: { code?: GsCode; cause?: unknown } = {}) {
    super(message)
    this.name = 'ExecutionError'
    this.code = options.code
    this.cause = options.cause
  }
}

export const isExecutionError = (error: unknown): error is ExecutionError => error instanceof ExecutionError

/**
 * `CONTRACT_ERROR_FALLBACK` ends with "contact support with the reference
 * below", which is only true when there is a GS code to render beneath the
 * message. A revert we cannot pin to a code has no reference to show, so it
 * gets the same copy without that promise. A test pins the two together so
 * they cannot drift apart.
 */
export const UNREFERENCED_ERROR_FALLBACK = 'Something went wrong. Try again, or contact support.'

export const getInsufficientFeeFundsMessage = (nativeAsset?: string): string =>
  `Not enough ${nativeAsset ?? 'funds'} in your signer wallet to cover the network fee. Add funds and try again.`

/** Keys viem and ethers hang identifying or human-readable text off. */
const TEXT_KEYS = ['code', 'shortMessage', 'details', 'reason', 'message'] as const

const MAX_CAUSE_DEPTH = 10

const readTextKeys = (record: Record<string, unknown>): string[] => {
  const parts: string[] = []
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
  return parts
}

/**
 * viem and ethers both nest the real failure several `cause` levels below the
 * error we catch, and spread the useful text across different keys. RTK Query
 * hides it one level deeper again, on `data` — which is the text `asError`
 * surfaces, so it has to be classified too or the displayed string would not be
 * the classified one. Collect all of it into one blob so the matchers below
 * only have to look in one place.
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
    parts.push(...readTextKeys(record))

    const data = record.data
    if (typeof data === 'string') {
      parts.push(data)
    } else if (typeof data === 'object' && data !== null) {
      parts.push(...readTextKeys(data as Record<string, unknown>))
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

  // CGW's pre-relay simulation outcome is a typed error the execution flow
  // branches on (retry vs. terminal). The caller guards this too — this check
  // keeps the classifier safe to call on any throwable.
  if (error instanceof RelaySimulationError) {
    return undefined
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
    return new ExecutionError(hasUnresolvedPlaceholder(message) ? CONTRACT_ERROR_FALLBACK : message, {
      code: gsCode,
      cause: error,
    })
  }

  if (matchesAny(INSUFFICIENT_FUNDS_PATTERNS, text)) {
    return new ExecutionError(getInsufficientFeeFundsMessage(nativeAsset), { cause: error })
  }

  if (matchesAny(CONTRACT_ERROR_PATTERNS, text)) {
    return new ExecutionError(UNREFERENCED_ERROR_FALLBACK, { cause: error })
  }

  return undefined
}
