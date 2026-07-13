import type { SecurityScanner } from './types'
import { getSeverityFromScore } from './constants'
import { hasRecoverySetup } from './recoveryDetection'

export const accountSetupScanner: SecurityScanner = {
  id: 'account_setup',
  scan: async (ctx) => {
    const { owners, threshold, modules, chainId, chainSupportsRecovery } = ctx
    const ownerCount = owners.length
    const now = new Date().toISOString()

    if (ownerCount === 0) {
      // Owner data hasn't loaded — distinct from "loaded and shows 0 owners" (impossible
      // for a real Safe). Return inconclusive so a transient missing-data state during
      // scan doesn't penalize the score or flag the Safe with a "weak threshold" entry
      // that flips on rescan once `safeInfo.owners` populates.
      const score = 50
      return {
        status: 'inconclusive',
        severity: getSeverityFromScore(score, { excluded: true }),
        score,
        evidence: ['Signer data not yet available'],
        remediation: 'Signer information will load shortly.',
        lastChecked: now,
      }
    }

    const baseEvidence = [
      { label: 'Signers', value: String(ownerCount) },
      { label: 'Threshold', value: `${threshold} of ${ownerCount}` },
    ]

    // Simple majority = strictly more than half. For even N this is N/2 + 1, not N/2.
    const simpleMajority = Math.floor(ownerCount / 2) + 1

    // n/n Safe (threshold === owner count, incl. 1/1): losing any single signer permanently
    // locks the Safe. Acceptable only when account recovery mitigates that lockout risk.
    if (threshold === ownerCount) {
      // Recovery isn't available on this chain — the lockout risk can't be mitigated, so this
      // is the most severe case.
      if (!chainSupportsRecovery) {
        const score = 10
        return {
          status: 'issue',
          severity: getSeverityFromScore(score),
          score,
          evidence: [...baseEvidence, 'Losing any signer would permanently lock this Safe'],
          remediation: 'Add another signer and lower the threshold so losing one key cannot lock this Safe.',
          lastChecked: now,
        }
      }

      // Recovery configured → the lockout risk is mitigated.
      if (hasRecoverySetup(chainId, modules)) {
        const score = 100
        return {
          status: 'clear',
          severity: getSeverityFromScore(score),
          score,
          evidence: baseEvidence,
          remediation: '',
          lastChecked: now,
        }
      }

      // Recovery is available but not configured — fixable, so flag as a (non-critical) risk.
      const score = 40
      const remediation =
        ownerCount === 1
          ? 'Set up account recovery, or add signers, so this Safe cannot be permanently locked if a signer loses access.'
          : 'Set up account recovery so this Safe can be recovered if a signer loses access.'
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: [...baseEvidence, 'Losing any signer would permanently lock this Safe'],
        remediation,
        lastChecked: now,
      }
    }

    // Threshold of 1 with multiple owners = any single signer can execute.
    if (threshold === 1) {
      const score = 15
      // For a 2-owner Safe, recommending threshold = 2 would create a single point of failure
      // (losing any one key permanently locks the Safe). Recommend adding a signer instead.
      const remediation =
        ownerCount === 2
          ? 'Add another signer and increase the threshold for stronger security.'
          : `Increase the threshold to at least ${simpleMajority} of ${ownerCount}.`
      return {
        status: 'issue',
        severity: getSeverityFromScore(score),
        score,
        evidence: [...baseEvidence, 'Any single signer can approve transactions'],
        remediation,
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
