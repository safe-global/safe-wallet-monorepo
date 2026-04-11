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
      status: 'partial',
      severity: 'Low',
      score: 70,
      evidence: [{ label: 'Status', value: 'Transaction scanning not available on this network' }],
      remediation:
        'Transaction scanning is not yet supported on this network. Exercise extra caution when reviewing transactions.',
      lastChecked: now,
    }
  },
}
