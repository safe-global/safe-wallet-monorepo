import type { SecurityScanner } from './types'

export const pendingTxScanner: SecurityScanner = {
  id: 'pending_tx',
  scan: async (ctx) => {
    const { queuedTxCount } = ctx
    const now = new Date().toISOString()

    if (queuedTxCount === 0) {
      return {
        status: 'clear',
        severity: 'Low',
        score: 100,
        evidence: ['No pending transactions'],
        remediation: '',
        lastChecked: now,
      }
    }

    if (queuedTxCount > 5) {
      return {
        status: 'issue',
        severity: 'High',
        score: 25,
        evidence: [`${queuedTxCount} pending transactions in queue`],
        remediation: 'Review pending transactions and execute or reject any that are stale.',
        lastChecked: now,
      }
    }

    return {
      status: 'partial',
      severity: 'Medium',
      score: 60,
      evidence: [`${queuedTxCount} pending transaction(s) in queue`],
      remediation: 'Review pending transactions to ensure none are stale or unnecessary.',
      lastChecked: now,
    }
  },
}
