import type { SecurityScanner } from './types'
import { getSeverityFromScore } from './constants'

export const multichainSetupScanner: SecurityScanner = {
  id: 'multichain_setup',
  scan: async (ctx) => {
    const { isMultichain, multichainSignersConsistent, multichainDeviatingChains } = ctx
    const now = new Date().toISOString()

    if (!isMultichain) {
      const score = 100
      return {
        status: 'not_applicable',
        severity: getSeverityFromScore(score, { excluded: true }),
        score,
        evidence: [{ label: 'Result', value: 'Deployed on a single network' }],
        remediation: '',
        lastChecked: now,
      }
    }

    if (!multichainSignersConsistent) {
      const chainList =
        multichainDeviatingChains.length > 0 ? multichainDeviatingChains.join(', ') : 'Multiple networks'

      const score = 30
      return {
        status: 'partial',
        severity: getSeverityFromScore(score),
        score,
        evidence: [
          { label: 'Result', value: 'Signer setup differs across networks' },
          { label: 'Affected', value: chainList },
        ],
        remediation:
          'Different signers across networks could break approvals and risk losing control. Switch to the affected network and review the signer setup.',
        lastChecked: now,
      }
    }

    const score = 100
    return {
      status: 'clear',
      severity: getSeverityFromScore(score),
      score,
      evidence: [{ label: 'Result', value: 'Signer setup is consistent across all networks' }],
      remediation: '',
      lastChecked: now,
    }
  },
}
