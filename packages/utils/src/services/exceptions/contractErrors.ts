/**
 * Single source of truth for user-facing Safe contract (GS) error messages.
 *
 * Both web and mobile read from here so the same on-chain error renders the
 * exact same text on every platform (see the parity tests). The raw GS code is
 * a support reference only — it never appears in a user-facing message.
 *
 * Source of the codes: https://github.com/safe-global/safe-smart-account/blob/main/docs/error_codes.md
 */

export type GsCode =
  | 'GS000'
  | 'GS001'
  | 'GS002'
  | 'GS010'
  | 'GS011'
  | 'GS012'
  | 'GS013'
  | 'GS020'
  | 'GS021'
  | 'GS022'
  | 'GS023'
  | 'GS024'
  | 'GS025'
  | 'GS026'
  | 'GS030'
  | 'GS031'
  | 'GS100'
  | 'GS101'
  | 'GS102'
  | 'GS103'
  | 'GS104'
  | 'GS105'
  | 'GS106'
  | 'GS200'
  | 'GS201'
  | 'GS202'
  | 'GS203'
  | 'GS204'
  | 'GS205'
  | 'GS300'
  | 'GS301'
  | 'GS400'

/**
 * How a given code should be treated in the product:
 * - `inline-validation`: preventable before signing; the form blocks first and
 *   the user should never see a raw error state (Bucket A).
 * - `runtime`: an actionable error we show to the user, with cause + next step
 *   and a "gas was spent" prefix when applicable (Bucket B).
 * - `internal`: should never reach a user in a normal flow; all share one
 *   generic fallback message (Bucket C).
 */
export type ContractErrorHandling = 'inline-validation' | 'runtime' | 'internal'

export interface ContractErrorMeta {
  /** User-facing copy. May contain `{nativeAsset}` / `{token}` placeholders. */
  message: string
  handling: ContractErrorHandling
}

/**
 * Shown for `internal` codes and for any code whose specific cause we cannot
 * determine at the point of failure (e.g. a reactive GS026 post-broadcast).
 */
export const CONTRACT_ERROR_FALLBACK = 'Something went wrong. Try again, or contact support with the reference below.'

/**
 * GS026 is one on-chain code covering three distinct causes. When we can
 * disambiguate before broadcast (pre-checks), we show the matching message.
 * When it surfaces reactively and the cause is unknown, we fall back to
 * `CONTRACT_ERROR_FALLBACK`.
 */
export type Gs026Reason = 'NOT_SIGNER' | 'STALE_NONCE' | 'BAD_SIGNATURE'

export const GS026_MESSAGES: Record<Gs026Reason, string> = {
  NOT_SIGNER: 'This wallet is not a signer of this Safe Account. Connect a signer wallet.',
  STALE_NONCE: 'Another transaction used this nonce. Refresh to get the current one.',
  BAD_SIGNATURE: 'Could not verify your signature. Sign the transaction again.',
}

const CONTRACT_ERRORS: Record<GsCode, ContractErrorMeta> = {
  // --- Bucket A: inline field validation, never an error state ---
  GS001: { message: 'Set a threshold before you continue', handling: 'inline-validation' },
  GS002: { message: 'Modules can only be enabled on a contract address', handling: 'inline-validation' },
  GS101: { message: 'This module address is not valid', handling: 'inline-validation' },
  GS201: { message: 'Threshold cannot be higher than the number of signers', handling: 'inline-validation' },
  GS202: { message: 'Threshold must be at least 1 signer', handling: 'inline-validation' },
  GS203: { message: 'This signer address is not valid', handling: 'inline-validation' },
  GS204: { message: 'This address is already a signer of this Safe Account', handling: 'inline-validation' },
  GS400: {
    message: 'The fallback handler cannot be this Safe Account. Use another address',
    handling: 'inline-validation',
  },

  // --- Bucket B: actionable runtime errors ---
  GS000: { message: 'Could not set up your Safe Account. Refresh and try again.', handling: 'runtime' },
  GS010: {
    message: 'Not enough gas to execute this transaction. Increase the gas limit and try again.',
    handling: 'runtime',
  },
  GS011: { message: 'Not enough {nativeAsset} in this Safe Account to cover the network fee.', handling: 'runtime' },
  GS012: {
    message: 'Not enough {token} to cover the network fee. Pay with {nativeAsset} instead.',
    handling: 'runtime',
  },
  GS020: { message: 'Could not verify your signature. Sign the transaction again.', handling: 'runtime' },
  GS023: { message: 'Could not verify your signature. Sign the transaction again.', handling: 'runtime' },
  GS024: { message: 'Could not verify the signature from your wallet. Reconnect and sign again.', handling: 'runtime' },
  GS025: { message: 'This transaction needs more confirmations before it can be executed.', handling: 'runtime' },
  GS030: { message: 'Only signers can confirm this transaction. Connect a signer wallet.', handling: 'runtime' },
  GS102: { message: 'This module is already enabled on your Safe Account.', handling: 'runtime' },
  GS103: { message: 'Modules changed since you opened this page. Refresh and try again.', handling: 'runtime' },
  GS205: { message: 'Signers changed since you opened this page. Refresh and try again.', handling: 'runtime' },
  GS300: { message: 'This guard is not compatible with your Safe Account.', handling: 'runtime' },
  GS301: { message: 'This module guard is not compatible with your Safe Account.', handling: 'runtime' },

  // --- Special codes (see Topics 4 & 6) ---
  // GS026: cause-dependent (see GS026_MESSAGES); reactive/unknown cause -> fallback.
  GS026: { message: CONTRACT_ERROR_FALLBACK, handling: 'runtime' },
  // GS013: undecodable custom errors; falls back until selector decoding lands.
  GS013: { message: CONTRACT_ERROR_FALLBACK, handling: 'runtime' },

  // --- Bucket C: should never reach a user; shared fallback ---
  GS021: { message: CONTRACT_ERROR_FALLBACK, handling: 'internal' },
  GS022: { message: CONTRACT_ERROR_FALLBACK, handling: 'internal' },
  GS031: { message: CONTRACT_ERROR_FALLBACK, handling: 'internal' },
  GS100: { message: CONTRACT_ERROR_FALLBACK, handling: 'internal' },
  GS104: { message: CONTRACT_ERROR_FALLBACK, handling: 'internal' },
  GS105: { message: CONTRACT_ERROR_FALLBACK, handling: 'internal' },
  GS106: { message: CONTRACT_ERROR_FALLBACK, handling: 'internal' },
  GS200: { message: CONTRACT_ERROR_FALLBACK, handling: 'internal' },
}

export interface ContractErrorParams {
  /** Native currency symbol, e.g. "ETH". */
  nativeAsset?: string
  /** ERC-20 token symbol used to pay the fee. */
  token?: string
}

const interpolate = (template: string, params: ContractErrorParams = {}): string =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key as keyof ContractErrorParams]
    return value ?? match
  })

/** Type guard: is `code` a known GS code? */
export const isGsCode = (code: unknown): code is GsCode =>
  typeof code === 'string' && Object.prototype.hasOwnProperty.call(CONTRACT_ERRORS, code)

const GS_CODE_RE = /\bGS\d{3}\b/

/**
 * Extract a known GS code from an error, if present: an explicit `code`
 * property (e.g. a pre-check error that identifies its GS code directly), or a
 * code embedded in `reason`/`message`. Lets the UI tell an on-chain (GS) error
 * apart from any other error so the code-only support reference is shown for
 * GS errors only.
 */
export const getGsCodeFromError = (
  error?: { message?: string; reason?: string; code?: unknown } | null,
): GsCode | undefined => {
  if (!error) return undefined

  if (isGsCode(error.code)) return error.code

  const reason = typeof error.reason === 'string' ? error.reason : ''
  const message = typeof error.message === 'string' ? error.message : ''
  const match = `${reason} ${message}`.match(GS_CODE_RE)

  return match && isGsCode(match[0]) ? match[0] : undefined
}

/** Resolve a GS code to its user-facing message, interpolating any placeholders. */
export const getContractErrorMessage = (code: GsCode, params?: ContractErrorParams): string =>
  interpolate(CONTRACT_ERRORS[code].message, params)

/** How the given code should be handled in the product. */
export const getContractErrorHandling = (code: GsCode): ContractErrorHandling => CONTRACT_ERRORS[code].handling

/** Resolve a specific GS026 cause to its message. */
export const getGs026Message = (reason: Gs026Reason): string => GS026_MESSAGES[reason]

export default CONTRACT_ERRORS
