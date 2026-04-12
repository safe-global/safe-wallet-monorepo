import type { SecurityScanner } from './types'

export const transactionScanningScanner: SecurityScanner = {
  id: 'transaction_scanning',
  scan: async (ctx) => {
    const { chainSupportsTransactionScanning } = ctx
    const now = new Date().toISOString()

    if (chainSupportsTransactionScanning) {
      return {
        status: 'clear',
        severity: 'Low',
        score: 100,
        evidence: [{ label: 'Status', value: 'Transactions are scanned before execution' }],
        remediation: '',
        lastChecked: now,
      }
    }

    return {
      status: 'not_applicable',
      severity: 'Low',
      score: 70,
      evidence: [{ label: 'Status', value: 'Transaction scanning not available on this network' }],
      remediation: '',
      lastChecked: now,
    }
  },
}
