import { Severity } from '@safe-global/utils/features/safe-shield/types'

export const SAFENET_RULE_IDS = ['R-4.1', 'R-4.2', 'R-4.3', 'R-4.4', 'R-4.5', 'R-4.6'] as const

export type SafenetRuleId = (typeof SAFENET_RULE_IDS)[number]

export type SafenetRuleCopy = {
  label: string
  description: string
  /** R-4.1–R-4.5 can be a legitimate action, so they warn; only a known-malicious address is a threat. */
  severity: Severity.WARN | Severity.CRITICAL
}

/** User-facing label, description and severity for each charter rule. Sentinels send only the code. */
export const SAFENET_RULES: Record<SafenetRuleId, SafenetRuleCopy> = {
  'R-4.1': {
    label: 'Safe account settings change',
    description: 'This transaction changes signers, threshold, modules, guard, or fallback handler.',
    severity: Severity.WARN,
  },
  'R-4.2': {
    label: 'Unexpected delegate call',
    description: "This transaction runs external code that can change your Safe account's setup.",
    severity: Severity.WARN,
  },
  'R-4.3': {
    label: 'Unknown recipient',
    description: 'Funds go to an address outside your usual recipients. This can be address poisoning.',
    severity: Severity.WARN,
  },
  'R-4.4': {
    label: 'Unknown spender',
    description: 'This transaction lets an unfamiliar address spend or move your assets.',
    severity: Severity.WARN,
  },
  'R-4.5': {
    label: 'Unlimited approval',
    description: 'This transaction approves an unlimited token amount.',
    severity: Severity.WARN,
  },
  'R-4.6': {
    label: 'Malicious threat detected',
    description: 'This transaction interacts with an address known to be malicious or compromised.',
    severity: Severity.CRITICAL,
  },
}

export const isSafenetRuleId = (value: string): value is SafenetRuleId =>
  (SAFENET_RULE_IDS as readonly string[]).includes(value)
