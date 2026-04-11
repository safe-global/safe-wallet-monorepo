import type { SecurityScanner } from './types'
import { ZERO_ADDRESS } from './constants'

export const modulesScanner: SecurityScanner = {
  id: 'modules',
  scan: async (ctx) => {
    const { modules } = ctx
    const now = new Date().toISOString()

    const activeModules = (modules ?? []).filter((m) => m.value !== ZERO_ADDRESS)

    if (activeModules.length === 0) {
      return {
        status: 'clear',
        severity: 'Low',
        score: 100,
        evidence: ['No modules installed'],
        remediation: '',
        lastChecked: now,
      }
    }

    const names = activeModules.map((m) => m.name || m.value.slice(0, 10) + '...')

    if (activeModules.length > 3) {
      return {
        status: 'partial',
        severity: 'Medium',
        score: 50,
        evidence: [`${activeModules.length} modules installed`, ...names],
        remediation: 'Review active modules and remove any that are no longer needed.',
        lastChecked: now,
      }
    }

    return {
      status: 'clear',
      severity: 'Low',
      score: 90,
      evidence: [`${activeModules.length} module(s) installed`, ...names],
      remediation: '',
      lastChecked: now,
    }
  },
}
