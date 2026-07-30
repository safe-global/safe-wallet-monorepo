import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { PolicyType, type ActivePolicy } from '@safe-global/store/gateway/policies/types'

const POLICY_LABEL: Record<PolicyType, string> = {
  [PolicyType.SpendingLimit]: 'Spending limit',
  [PolicyType.Recovery]: 'Account recovery',
  [PolicyType.TokenWithdraw]: 'Token withdraw allowlist',
  [PolicyType.Cosigner]: 'Cosigner',
  [PolicyType.Allow]: 'Allow by default',
  [PolicyType.NativeTransfer]: 'Native transfers',
  [PolicyType.Deny]: 'Deny by default',
}

/** Falls back to the raw wire value so a policy type we don't know yet still labels its row. */
export const labelOf = (type: PolicyType): string => POLICY_LABEL[type] ?? type

/** The tokens a policy is scoped to, for a visual cue on the row. Empty for other types. */
export const tokensOf = (policy: ActivePolicy): Array<{ address: string; symbol: string; logoUri?: string | null }> => {
  if (policy.type === PolicyType.TokenWithdraw) return policy.data.allowlist.map((entry) => entry.token)
  if (policy.type === PolicyType.Cosigner) return policy.data.rules.map((rule) => rule.token)
  if (policy.type === PolicyType.SpendingLimit) return policy.data.limits.map((limit) => limit.token)

  return []
}

const tokenLabel = (token: { address: string; symbol: string }) => token.symbol || shortenAddress(token.address)

/**
 * What distinguishes one entry from its siblings of the same type.
 *
 * Rows live inside a section already named after the policy type, so repeating that
 * name tells the reader nothing — the scope does: which token, which spender, which
 * recoverer.
 */
export const entryLabelOf = (policy: ActivePolicy): string => {
  switch (policy.type) {
    case PolicyType.TokenWithdraw: {
      const tokens = policy.data.allowlist.map((entry) => tokenLabel(entry.token))
      return tokens.length > 0 ? tokens.join(' · ') : 'Any token'
    }
    case PolicyType.SpendingLimit:
      return shortenAddress(policy.data.beneficiary)
    case PolicyType.Recovery:
      return policy.data.recoverers[0] ? shortenAddress(policy.data.recoverers[0]) : 'Recovery'
    case PolicyType.Cosigner: {
      const tokens = policy.data.rules.map((rule) => tokenLabel(rule.token))
      return tokens.length > 0 ? tokens.join(' · ') : 'Cosigner'
    }
    case PolicyType.Allow:
      return 'Any transaction'
    default:
      // A type the union doesn't know yet still gets a readable label at runtime.
      return labelOf((policy as ActivePolicy).type)
  }
}

/** The entry's detail, minus whatever {@link entryLabelOf} already says. */
export const entrySummaryOf = (policy: ActivePolicy): string => {
  switch (policy.type) {
    case PolicyType.TokenWithdraw: {
      const recipients = policy.data.allowlist.reduce((n, entry) => n + entry.recipients.length, 0)
      return `${recipients} allowed ${recipients === 1 ? 'recipient' : 'recipients'}`
    }
    case PolicyType.SpendingLimit: {
      const count = policy.data.limits.length
      return `${count} token ${count === 1 ? 'limit' : 'limits'}`
    }
    case PolicyType.Recovery: {
      const count = policy.data.recoverers.length
      return count > 1 ? `${count} recoverers` : ''
    }
    case PolicyType.Cosigner: {
      const count = policy.data.rules.length
      return `${count} ${count === 1 ? 'rule' : 'rules'}`
    }
    case PolicyType.Allow:
      return 'No restrictions'
    default:
      return ''
  }
}

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
