import type { SecurityScanner } from './types'

export const signerActivityScanner: SecurityScanner = {
  id: 'signer_activity',
  scan: async () => {
    const now = new Date().toISOString()

    return {
      status: 'partial' as const,
      severity: 'Medium' as const,
      score: 50,
      evidence: ['Automated activity detection not yet available'],
      remediation: 'Manually verify that all signers are still active and accessible.',
      lastChecked: now,
    }
  },
}
