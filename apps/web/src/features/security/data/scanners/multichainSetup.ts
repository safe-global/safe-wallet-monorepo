import type { SecurityScanner } from './types'

export const multichainSetupScanner: SecurityScanner = {
  id: 'multichain_setup',
  scan: async (ctx) => {
    const { isMultichain, multichainSignersConsistent, multichainDeviatingChains } = ctx
    const now = new Date().toISOString()

    if (!isMultichain) {
      return {
        status: 'not_applicable',
        severity: 'Low',
        score: 100,
        evidence: [{ label: 'Result', value: 'Deployed on a single network' }],
        remediation: '',
        lastChecked: now,
      }
    }

    if (!multichainSignersConsistent) {
      const chainList =
        multichainDeviatingChains.length > 0 ? multichainDeviatingChains.join(', ') : 'Multiple networks'

      return {
        status: 'partial',
        severity: 'Medium',
        score: 30,
        evidence: [
          { label: 'Result', value: 'Signer setup differs across networks' },
          { label: 'Affected', value: chainList },
        ],
        remediation:
          'Different signers across networks could break approvals and risk losing control. Switch to the affected network and review the signer setup.',
        lastChecked: now,
      }
    }

    return {
      status: 'clear',
      severity: 'Low',
      score: 100,
      evidence: [{ label: 'Result', value: 'Signer setup is consistent across all networks' }],
      remediation: '',
      lastChecked: now,
    }
  },
}
