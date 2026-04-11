import type { SecurityScanner } from './types'
import { ZERO_ADDRESS } from './constants'

export const guardScanner: SecurityScanner = {
  id: 'guard',
  scan: async (ctx) => {
    const { guard } = ctx
    const now = new Date().toISOString()

    const hasGuard = guard !== null && guard.value !== ZERO_ADDRESS

    if (!hasGuard) {
      return {
        status: 'partial',
        severity: 'Medium',
        score: 50,
        evidence: ['No transaction guard is configured'],
        remediation: 'Enable a transaction guard to add an extra layer of validation before execution.',
        lastChecked: now,
      }
    }

    const guardName = guard.name || guard.value.slice(0, 10) + '...'
    return {
      status: 'clear',
      severity: 'Low',
      score: 100,
      evidence: [`Guard enabled: ${guardName}`],
      remediation: '',
      lastChecked: now,
    }
  },
}
