import {
  DOMAIN_BY_HUNDRED,
  ERROR_CODE_MAP,
  ErrorDomain,
  ErrorLayer,
  ErrorType,
  type ErrorClassification,
} from './errorTaxonomy'

export interface NormalizedError {
  domain: ErrorDomain
  type: ErrorType
  layer: ErrorLayer
  /** Numeric Safe code (e.g. `804`) or on-chain code (e.g. `GS013`) as a string. */
  code: string
  isUserFacing: boolean
  /** PII-scrubbed message, safe for debugging sinks. Never sent to Mixpanel. */
  sanitizedMessage: string
}

export interface NormalizeErrorInput {
  /** Numeric part of the coded error (`CodedException.code`). */
  code: number
  /** Full error message; used for cause refinement and sanitized for output. */
  message: string
  isUserFacing: boolean
}

/** Ethereum addresses (40 hex) and longer blobs (calldata, hashes, keys). */
const HEX_BLOB_RE = /0x[a-fA-F0-9]{40,}/g

/** Safe smart-contract revert code, e.g. `GS013` — signals an on-chain failure. */
const GS_CODE_RE = /\bGS\d{3}\b/

/**
 * Ordered cross-domain cause matchers. The first match refines the per-code
 * default `type`. `user_rejected` is first so a rejection always wins.
 */
const TYPE_MATCHERS: ReadonlyArray<readonly [RegExp, ErrorType]> = [
  [
    /user rejected|user denied|rejected the request|action_rejected|rejected by user|\b4001\b/i,
    ErrorType.USER_REJECTED,
  ],
  [/eth_sign/i, ErrorType.ETH_SIGN_DISABLED],
  [/insufficient funds/i, ErrorType.INSUFFICIENT_FUNDS],
  [/slippage/i, ErrorType.SLIPPAGE_EXCEEDED],
  [/order.*expired|expired.*order/i, ErrorType.ORDER_EXPIRED],
  [/nonce/i, ErrorType.NONCE_CONFLICT],
  [/timeout|timed out/i, ErrorType.WALLET_TIMEOUT],
  [/chain mismatch|wrong network|network changed/i, ErrorType.CHAIN_MISMATCH],
  [/ledger/i, ErrorType.LEDGER_ERROR],
]

export const sanitizeErrorMessage = (message: string): string => message.replace(HEX_BLOB_RE, '[redacted]')

const classifyByCode = (code: number): ErrorClassification => {
  const known = ERROR_CODE_MAP[code]
  if (known) return known

  if (!Number.isFinite(code) || code === 0) {
    return { domain: ErrorDomain.FRONTEND_EXCEPTION, type: ErrorType.UNKNOWN, layer: ErrorLayer.OFF_CHAIN }
  }

  const hundred = Math.floor(code / 100)
  return {
    domain: DOMAIN_BY_HUNDRED[hundred] ?? ErrorDomain.FRONTEND_EXCEPTION,
    type: ErrorType.UNKNOWN,
    layer: ErrorLayer.OFF_CHAIN,
  }
}

const refineType = (message: string): ErrorType | undefined =>
  TYPE_MATCHERS.find(([pattern]) => pattern.test(message))?.[1]

export const normalizeError = ({ code, message, isUserFacing }: NormalizeErrorInput): NormalizedError => {
  const { domain, layer: baseLayer, type: baseType } = classifyByCode(code)

  const refinedType = refineType(message)
  let type = refinedType ?? baseType
  let layer = baseLayer
  let codeStr = String(code)

  // A user rejection is off-chain by definition and must not be reclassified as
  // an on-chain revert, even if the message happens to contain a GS code.
  if (refinedType !== ErrorType.USER_REJECTED) {
    const gsMatch = message.match(GS_CODE_RE)
    if (gsMatch) {
      layer = ErrorLayer.ON_CHAIN
      type = ErrorType.ON_CHAIN_REVERT
      codeStr = gsMatch[0]
    }
  }

  return {
    domain,
    type,
    layer,
    code: codeStr,
    isUserFacing,
    sanitizedMessage: sanitizeErrorMessage(message),
  }
}
