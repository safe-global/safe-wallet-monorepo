import type { SecurityScanner } from './types'

export const tokenApprovalsScanner: SecurityScanner = {
  id: 'token_approvals',
  scan: async () => {
    const now = new Date().toISOString()

    return {
      status: 'partial' as const,
      severity: 'Medium' as const,
      score: 50,
      evidence: ['Automated approval scanning not yet available'],
      remediation: 'Manually review token approvals and revoke any that are unnecessary.',
      lastChecked: now,
    }
  },
}
