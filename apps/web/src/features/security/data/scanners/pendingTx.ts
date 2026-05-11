import type { SecurityScanner } from './types'

export const pendingTxScanner: SecurityScanner = {
  id: 'pending_tx',
  scan: async (ctx) => {
    const { queuedTxCount } = ctx
    const now = new Date().toISOString()

    if (queuedTxCount <= 2) {
      return {
        status: 'clear',
        severity: 'Low',
        score: 100,
        evidence: [
          {
            label: 'Status',
            value:
              queuedTxCount === 0
                ? 'No pending transactions'
                : `${queuedTxCount} pending transaction${queuedTxCount === 1 ? '' : 's'}`,
          },
        ],
        remediation: '',
        lastChecked: now,
      }
    }

    if (queuedTxCount >= 5) {
      return {
        status: 'issue',
        severity: 'High',
        score: 25,
        evidence: [{ label: 'Queued', value: `${queuedTxCount} transactions` }],
        remediation:
          'A large queue increases the risk of executing outdated or malicious transactions. Stale transactions can be front-run or may interact with contracts that have changed state. Review and reject any that are no longer needed.',
        lastChecked: now,
      }
    }

    return {
      status: 'partial',
      severity: 'Medium',
      score: 60,
      evidence: [{ label: 'Queued', value: `${queuedTxCount} transactions` }],
      remediation:
        'Pending transactions that sit unexecuted can become stale and may not reflect current intentions. Review your queue to ensure all transactions are still valid.',
      lastChecked: now,
    }
  },
}
