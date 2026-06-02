import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { SecurityScanner } from './types'
import { getSeverityFromScore } from './constants'
import { isDelayModifier } from './recoveryDetection'

export const recoveryScanner: SecurityScanner = {
  id: 'recovery',
  scan: async (ctx) => {
    const { chainSupportsRecovery, modules, chainId } = ctx
    const now = new Date().toISOString()

    if (!chainSupportsRecovery) {
      const score = 100
      return {
        status: 'not_applicable',
        severity: getSeverityFromScore(score, { excluded: true }),
        score,
        evidence: [{ label: 'Status', value: 'Not available on this network' }],
        remediation: '',
        lastChecked: now,
      }
    }

    const activeModules = (modules ?? []).filter((m) => m.value !== ZERO_ADDRESS)

    // No modules at all — recovery is definitely not configured
    if (activeModules.length === 0) {
      const score = 20
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: [{ label: 'Status', value: 'No recovery configured' }],
        remediation:
          'If all signers lose access, this Safe cannot be recovered. Set up a recovery mechanism to protect against key loss.',
        lastChecked: now,
      }
    }

    // Check if any module is a known Delay Modifier
    const hasDelayModifier = activeModules.some((m) => isDelayModifier(chainId, m.value, m.name))

    if (hasDelayModifier) {
      const score = 100
      return {
        status: 'clear',
        severity: getSeverityFromScore(score),
        score,
        evidence: [{ label: 'Status', value: 'Recovery module configured' }],
        remediation: '',
        lastChecked: now,
      }
    }

    // Modules exist but none are a recognized Delay Modifier
    const score = 60
    return {
      status: 'partial',
      severity: getSeverityFromScore(score),
      score,
      evidence: [{ label: 'Status', value: 'Recovery not confirmed' }],
      remediation:
        'This Safe has modules installed but none were recognized as a recovery module. Verify that account recovery is configured.',
      lastChecked: now,
    }
  },
}
