import { maybePlural } from '@safe-global/utils/utils/formatters'
import type { SecurityScanner } from './types'
import { getSeverityFromScore } from './constants'

/** Up to this many queued txs is fine — clear status. */
const CLEAR_QUEUE_MAX = 2
/** From this many queued txs onwards the queue is treated as a high-severity issue. */
const LARGE_QUEUE_MIN = 5

export const pendingTxScanner: SecurityScanner = {
  id: 'pending_tx',
  scan: async (ctx) => {
    const { queuedTxCount } = ctx
    const now = new Date().toISOString()

    if (queuedTxCount <= CLEAR_QUEUE_MAX) {
      const score = 100
      return {
        status: 'clear',
        severity: getSeverityFromScore(score),
        score,
        evidence: [
          {
            label: 'Status',
            value:
              queuedTxCount === 0
                ? 'No pending transactions'
                : `${queuedTxCount} pending transaction${maybePlural(queuedTxCount)}`,
          },
        ],
        remediation: '',
        lastChecked: now,
      }
    }

    if (queuedTxCount >= LARGE_QUEUE_MIN) {
      const score = 25
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: [{ label: 'Queued', value: `${queuedTxCount} transactions` }],
        remediation:
          'A large queue increases the risk of executing outdated or malicious transactions. Stale transactions can be front-run or may interact with contracts that have changed state. Review and reject any that are no longer needed.',
        lastChecked: now,
      }
    }

    const score = 60
    return {
      status: 'partial',
      severity: getSeverityFromScore(score),
      score,
      evidence: [{ label: 'Queued', value: `${queuedTxCount} transactions` }],
      remediation:
        'Pending transactions that sit unexecuted can become stale and may not reflect current intentions. Review your queue to ensure all transactions are still valid.',
      lastChecked: now,
    }
  },
}
