import type { SecurityScanner } from './types'

export const accountSetupScanner: SecurityScanner = {
  id: 'account_setup',
  scan: async (ctx) => {
    const { owners, threshold } = ctx
    const ownerCount = owners.length
    const now = new Date().toISOString()

    if (ownerCount === 0) {
      return {
        status: 'partial',
        severity: 'Medium',
        score: 50,
        evidence: ['Signer data not yet available'],
        remediation: 'Open this Safe directly to load signer information.',
        lastChecked: now,
      }
    }

    // Single signer = no multisig protection
    if (ownerCount === 1) {
      return {
        status: 'issue',
        severity: 'Critical',
        score: 10,
        evidence: [
          { label: 'Signers', value: String(ownerCount) },
          { label: 'Threshold', value: `${threshold} of ${ownerCount}` },
        ],
        remediation: 'Add additional signers and increase the threshold for better security.',
        lastChecked: now,
      }
    }

    // Threshold of 1 with multiple owners = any single signer can execute
    if (threshold === 1) {
      return {
        status: 'issue',
        severity: 'Critical',
        score: 15,
        evidence: [
          { label: 'Signers', value: String(ownerCount) },
          { label: 'Threshold', value: `${threshold} of ${ownerCount}` },
          'Any single signer can approve transactions',
        ],
        remediation: `Increase the threshold to at least ${Math.ceil(ownerCount / 2)} of ${ownerCount}.`,
        lastChecked: now,
      }
    }

    // Threshold below simple majority = suboptimal
    const simpleMajority = Math.ceil(ownerCount / 2)
    if (threshold < simpleMajority) {
      return {
        status: 'partial',
        severity: 'Medium',
        score: 60,
        evidence: [
          { label: 'Signers', value: String(ownerCount) },
          { label: 'Threshold', value: `${threshold} of ${ownerCount}` },
          { label: 'Recommended', value: `at least ${simpleMajority} of ${ownerCount}` },
        ],
        remediation: `Consider increasing the threshold to ${simpleMajority} of ${ownerCount} for stronger security.`,
        lastChecked: now,
      }
    }

    // Good setup: threshold >= simple majority
    return {
      status: 'clear',
      severity: 'Low',
      score: 100,
      evidence: [
        { label: 'Signers', value: String(ownerCount) },
        { label: 'Threshold', value: `${threshold} of ${ownerCount}` },
      ],
      remediation: '',
      lastChecked: now,
    }
  },
}
