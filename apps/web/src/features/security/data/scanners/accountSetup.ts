import type { SecurityScanner } from './types'
import { getSeverityFromScore } from './constants'

export const accountSetupScanner: SecurityScanner = {
  id: 'account_setup',
  scan: async (ctx) => {
    const { owners, threshold } = ctx
    const ownerCount = owners.length
    const now = new Date().toISOString()

    if (ownerCount === 0) {
      const score = 50
      return {
        status: 'partial',
        severity: getSeverityFromScore(score),
        score,
        evidence: ['Signer data not yet available'],
        remediation: 'Open this Safe directly to load signer information.',
        lastChecked: now,
      }
    }

    const baseEvidence = [
      { label: 'Signers', value: String(ownerCount) },
      { label: 'Threshold', value: `${threshold} of ${ownerCount}` },
    ]

    // Simple majority = strictly more than half. For even N this is N/2 + 1, not N/2.
    const simpleMajority = Math.floor(ownerCount / 2) + 1

    // Single signer = no multisig protection
    if (ownerCount === 1) {
      const score = 10
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: baseEvidence,
        remediation: 'Add additional signers and increase the threshold for better security.',
        lastChecked: now,
      }
    }

    // Threshold of 1 with multiple owners = any single signer can execute.
    if (threshold === 1) {
      const score = 15
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: [...baseEvidence, 'Any single signer can approve transactions'],
        remediation: `Increase the threshold to at least ${simpleMajority} of ${ownerCount}.`,
        lastChecked: now,
      }
    }

    // Threshold below simple majority = suboptimal
    if (threshold < simpleMajority) {
      const score = 60
      return {
        status: 'partial',
        severity: getSeverityFromScore(score),
        score,
        evidence: [...baseEvidence, { label: 'Recommended', value: `at least ${simpleMajority} of ${ownerCount}` }],
        remediation: `Consider increasing the threshold to ${simpleMajority} of ${ownerCount} for stronger security.`,
        lastChecked: now,
      }
    }

    // Good setup: threshold >= simple majority
    const score = 100
    return {
      status: 'clear',
      severity: getSeverityFromScore(score),
      score,
      evidence: baseEvidence,
      remediation: '',
      lastChecked: now,
    }
  },
}
