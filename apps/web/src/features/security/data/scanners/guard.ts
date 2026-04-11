import type { SecurityScanner } from './types'
import { ZERO_ADDRESS, HIGH_VALUE_THRESHOLD_USD } from './constants'

const TRUSTED_GUARD_NAMES = ['hypernative']

const isTrustedGuard = (name?: string | null): boolean => {
  if (!name) return false
  const lower = name.toLowerCase()
  return TRUSTED_GUARD_NAMES.some((trusted) => lower.includes(trusted))
}

export const guardScanner: SecurityScanner = {
  id: 'guard',
  scan: async (ctx) => {
    const { guard, chainSupportsHypernative } = ctx
    const now = new Date().toISOString()

    const hasGuard = guard !== null && guard.value !== ZERO_ADDRESS

    // Tier 1: Untrusted guard detected
    if (hasGuard && !isTrustedGuard(guard.name)) {
      const guardLabel = guard.name || `${guard.value.slice(0, 10)}...`
      return {
        status: 'issue',
        severity: 'High',
        score: 30,
        evidence: [
          { label: 'Guard', value: guardLabel },
          { label: 'Status', value: 'Unverified guard contract' },
        ],
        remediation:
          'A transaction guard is set but could not be verified as trusted. Review it in Settings to ensure it is from a recognized provider.',
        lastChecked: now,
        ctaLabelOverride: 'Review modules',
      }
    }

    // Tier 2: Known trusted guard
    if (hasGuard && isTrustedGuard(guard.name)) {
      return {
        status: 'clear',
        severity: 'Low',
        score: 100,
        evidence: [
          { label: 'Guard', value: guard.name ?? 'Trusted Guard' },
          { label: 'Status', value: 'Active protection' },
        ],
        remediation: '',
        lastChecked: now,
        partner: 'hypernative',
      }
    }

    // Tier 3: No guard, high-value Safe on a chain that supports enterprise-grade protection
    if (!hasGuard && chainSupportsHypernative && ctx.balanceUsd > HIGH_VALUE_THRESHOLD_USD) {
      return {
        status: 'partial',
        severity: 'Medium',
        score: 60,
        evidence: [{ label: 'Status', value: 'No transaction guard configured' }],
        remediation:
          'For high-value accounts, a transaction guard adds pre-execution validation. Enterprise-grade protection is available.',
        lastChecked: now,
        ctaLabelOverride: 'Learn more',
        partner: 'hypernative',
      }
    }

    // Tier 4: No guard — normal (low-value Safe or unsupported chain)
    return {
      status: 'clear',
      severity: 'Low',
      score: 100,
      evidence: [{ label: 'Status', value: 'No guard required' }],
      remediation: '',
      lastChecked: now,
    }
  },
}
