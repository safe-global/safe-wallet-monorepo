import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { PolicyType, type ActivePolicy } from '@safe-global/store/gateway/policies/types'

const POLICY_LABEL: Record<PolicyType, string> = {
  [PolicyType.SpendingLimit]: 'Spending limit',
  [PolicyType.Recovery]: 'Account recovery',
  [PolicyType.TokenWithdraw]: 'Token withdraw allowlist',
  [PolicyType.Cosigner]: 'Cosigner',
  [PolicyType.Allow]: 'Allow policy',
}

/** Falls back to the raw wire value so a policy type we don't know yet still labels its row. */
export const labelOf = (type: PolicyType): string => POLICY_LABEL[type] ?? type

/** One-line description of a configured policy. Empty when the type carries no data. */
export const summarize = (policy: ActivePolicy): string => {
  switch (policy.type) {
    case PolicyType.SpendingLimit:
      return `Spender ${shortenAddress(policy.data.beneficiary)} · ${policy.data.limits.length} token limit(s)`
    case PolicyType.Recovery:
      return `${policy.data.recoverers.length} recoverer(s)`
    case PolicyType.TokenWithdraw: {
      const recipients = policy.data.allowlist.reduce((n, entry) => n + entry.recipients.length, 0)
      return `${policy.data.allowlist.length} token(s) · ${recipients} allowed recipient(s)`
    }
    case PolicyType.Cosigner:
      return `${policy.data.rules.length} cosigner rule(s)`
    // The guard's catch-all entry carries no data to summarise.
    case PolicyType.Allow:
      return ''
    default:
      return ''
  }
}
