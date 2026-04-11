import type { SecurityScanner } from './types'

export const trustedSafeScanner: SecurityScanner = {
  id: 'trusted_safe',
  scan: async (ctx) => {
    const { isTrustedSafe } = ctx
    const now = new Date().toISOString()

    if (!isTrustedSafe) {
      return {
        status: 'partial',
        severity: 'Medium',
        score: 50,
        evidence: ['This Safe is not in your trusted list'],
        remediation: 'Mark this Safe as trusted to reduce the risk of address impersonation.',
        lastChecked: now,
      }
    }

    return {
      status: 'clear',
      severity: 'Low',
      score: 100,
      evidence: ['Safe is marked as trusted'],
      remediation: '',
      lastChecked: now,
    }
  },
}
