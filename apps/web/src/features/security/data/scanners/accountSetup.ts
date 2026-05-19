import type { SecurityScanner } from './types'
import { getSeverityFromScore } from './constants'

export const accountSetupScanner: SecurityScanner = {
  id: 'account_setup',
  scan: async (ctx) => {
    const { owners, threshold } = ctx
    const ownerCount = owners.length
    const now = new Date().toISOString()

    if (ownerCount === 0) {
      // Owner data hasn't loaded — distinct from "loaded and shows 0 owners" (impossible
      // for a real Safe). Return inconclusive so a transient missing-data state during
      // scan doesn't penalize the score or flag the Safe with a "weak threshold" entry
      // that flips on rescan once `safeInfo.owners` populates.
      return {
        status: 'inconclusive',
        severity: 'Low',
        score: 50,
        evidence: ['Signer data not yet available'],
        remediation: 'Signer information will load shortly.',
        lastChecked: now,
      }
    }

    const baseEvidence = [
      { label: 'Signers', value: String(ownerCount) },
      { label: 'Threshold', value: `${threshold} of ${ownerCount}` },
    ]

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
    // Always recommend at least 2/N so 1/2 Safes don't get told to "raise threshold to 1 of 2".
    if (threshold === 1) {
      const score = 15
      const recommendedThreshold = Math.max(Math.ceil(ownerCount / 2), 2)
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: [...baseEvidence, 'Any single signer can approve transactions'],
        remediation: `Increase the threshold to at least ${recommendedThreshold} of ${ownerCount}.`,
        lastChecked: now,
      }
    }

    // Threshold below simple majority = suboptimal
    const simpleMajority = Math.ceil(ownerCount / 2)
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
