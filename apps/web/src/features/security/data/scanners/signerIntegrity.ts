import type { SecurityScanner } from './types'
import { getSeverityFromScore } from './constants'

/**
 * Signer integrity scanner — checks whether Safe owners have exposure to
 * sanctioned or flagged sources.
 *
 * Currently returns `inconclusive` for all signers. The plan is to call a
 * CGW endpoint that proxies Blockaid's Risk Exposure API (server-side),
 * keeping API keys off the client. Once the CGW endpoint exists, this
 * scanner will be wired to it.
 */
export const signerIntegrityScanner: SecurityScanner = {
  id: 'signer_integrity',
  scan: async (ctx) => {
    const now = new Date().toISOString()

    // TODO: Replace with CGW endpoint call when available.
    // The endpoint should accept an array of signer addresses + chainId
    // and return per-signer risk exposure data (blocklist status, risk level,
    // exposure categories). Until then, return inconclusive so the UI shows
    // "Screening not yet available" rather than a false "all clear".
    const score = 50
    return {
      status: 'inconclusive',
      severity: getSeverityFromScore(score),
      score,
      evidence: [
        { label: 'Status', value: 'Signer screening not yet available' },
        { label: 'Signers', value: `${ctx.owners.length}` },
      ],
      remediation: 'Signer screening will be available once the service integration is complete.',
      lastChecked: now,
    }
  },
}
