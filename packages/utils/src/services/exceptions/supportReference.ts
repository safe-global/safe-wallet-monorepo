/**
 * A "support reference" is what the Details panel of a user-facing error shows:
 * a minimal, PII-free set of fields support can act on — never the raw error
 * payload. See WA-3005 guideline #6 ("Details is a support reference, never a
 * payload") and its acceptance criterion (code, tx hash, network, timestamp,
 * copy button — nothing else).
 */

import { isGsCode } from './contractErrors'

export interface SupportReference {
  /** GS code, an app error code, or `UNKNOWN` when the failure is unmapped. */
  code: string
  /** Transaction hash, when the failure happened after broadcast. */
  txHash?: string
  /** Human-readable network name, e.g. "Ethereum". */
  network?: string
  /** ISO-8601 timestamp of when the reference was built. */
  timestamp: string
}

const GS_CODE_RE = /\bGS\d{3}\b/
/** App coded-error prefix, e.g. "804: Error executing a transaction". */
const CODED_ERROR_RE = /\b(\d{3})\s*:/

const UNKNOWN_CODE = 'UNKNOWN'

/**
 * Derive a support code from an error: a GS code if present, otherwise an app
 * coded-error number, otherwise `UNKNOWN`. Never returns free-text.
 */
export const getErrorCode = (error?: { message?: string; reason?: string } | null): string => {
  if (!error) return UNKNOWN_CODE

  const reason = typeof error.reason === 'string' ? error.reason : ''
  const message = typeof error.message === 'string' ? error.message : ''
  const haystack = `${reason} ${message}`

  const gsMatch = haystack.match(GS_CODE_RE)
  if (gsMatch && isGsCode(gsMatch[0])) return gsMatch[0]

  const codedMatch = message.match(CODED_ERROR_RE)
  if (codedMatch) return codedMatch[1]

  return UNKNOWN_CODE
}

export const buildSupportReference = (
  error?: { message?: string; reason?: string } | null,
  opts: { network?: string; txHash?: string; timestamp?: string } = {},
): SupportReference => ({
  code: getErrorCode(error),
  txHash: opts.txHash,
  network: opts.network,
  timestamp: opts.timestamp ?? new Date().toISOString(),
})

/** A single copyable string of the reference for the Details "copy" button. */
export const formatSupportReference = (ref: SupportReference): string =>
  [
    `Code: ${ref.code}`,
    ref.txHash ? `Transaction: ${ref.txHash}` : undefined,
    ref.network ? `Network: ${ref.network}` : undefined,
    `Time: ${ref.timestamp}`,
  ]
    .filter(Boolean)
    .join('\n')
