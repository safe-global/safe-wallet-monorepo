import type { SecurityScanner } from './types'
import { getSeverityFromScore } from './constants'

export const transactionScanningScanner: SecurityScanner = {
  id: 'transaction_scanning',
  scan: async (ctx) => {
    const { chainSupportsTransactionScanning } = ctx
    const now = new Date().toISOString()

    if (chainSupportsTransactionScanning) {
      const score = 100
      return {
        status: 'clear',
        severity: getSeverityFromScore(score),
        score,
        evidence: [{ label: 'Status', value: 'Transactions are scanned before execution' }],
        remediation: '',
        lastChecked: now,
      }
    }

    const score = 70
    return {
      status: 'not_applicable',
      severity: getSeverityFromScore(score, { excluded: true }),
      score,
      evidence: [{ label: 'Status', value: 'Transaction scanning not available on this network' }],
      remediation: '',
      lastChecked: now,
    }
  },
}
