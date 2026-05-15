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

    const baseEvidence = [
      { label: 'Signers', value: String(ownerCount) },
      { label: 'Threshold', value: `${threshold} of ${ownerCount}` },
    ]

    // Single signer = no multisig protection
    if (ownerCount === 1) {
      return {
        status: 'issue',
        severity: 'Critical',
        score: 10,
        evidence: baseEvidence,
        remediation: 'Add additional signers and increase the threshold for better security.',
        lastChecked: now,
      }
    }

    // Threshold of 1 with multiple owners = any single signer can execute.
    // Always recommend at least 2/N so 1/2 Safes don't get told to "raise threshold to 1 of 2".
    if (threshold === 1) {
      const recommendedThreshold = Math.max(Math.ceil(ownerCount / 2), 2)
      return {
        status: 'issue',
        severity: 'Critical',
        score: 15,
        evidence: [...baseEvidence, 'Any single signer can approve transactions'],
        remediation: `Increase the threshold to at least ${recommendedThreshold} of ${ownerCount}.`,
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
        evidence: [...baseEvidence, { label: 'Recommended', value: `at least ${simpleMajority} of ${ownerCount}` }],
        remediation: `Consider increasing the threshold to ${simpleMajority} of ${ownerCount} for stronger security.`,
        lastChecked: now,
      }
    }

    // Good setup: threshold >= simple majority
    return {
      status: 'clear',
      severity: 'Low',
      score: 100,
      evidence: baseEvidence,
      remediation: '',
      lastChecked: now,
    }
  },
}
