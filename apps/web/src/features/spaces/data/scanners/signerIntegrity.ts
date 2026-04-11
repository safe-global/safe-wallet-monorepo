import type { SecurityScanner } from './types'

export const signerIntegrityScanner: SecurityScanner = {
  id: 'signer_integrity',
  scan: async () => {
    const now = new Date().toISOString()

    return {
      status: 'partial' as const,
      severity: 'Medium' as const,
      score: 50,
      evidence: ['Automated sanctions and compromise screening not yet available'],
      remediation: 'Manually verify that no signers appear on sanctions lists or have been compromised.',
      lastChecked: now,
    }
  },
}
