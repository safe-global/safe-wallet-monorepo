import type { SecurityScanner } from './types'

export const signerIntegrityScanner: SecurityScanner = {
  id: 'signer_integrity',
  scan: async () => {
    const now = new Date().toISOString()

    // TODO: Requires server-side proxy (CGW endpoint) for Blockaid Risk Exposure API.
    // Browser CORS blocks direct calls to api.blockaid.io.
    // See: https://docs.blockaid.io — POST /v0/address/risk-exposure
    return {
      status: 'partial' as const,
      severity: 'Medium' as const,
      score: 50,
      evidence: [{ label: 'Status', value: 'Automated screening not yet available' }],
      remediation: 'Manually verify that all signers are trustworthy and have not been compromised.',
      lastChecked: now,
    }
  },
}
