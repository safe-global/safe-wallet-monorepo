import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { accessOf, PolicyType, type ActivePolicy } from '@safe-global/store/gateway/policies/types'
import { isFallbackActivePolicy } from './policyAccess'
import { safeManagementFunctionOf } from './SafeManagementPolicy/identify'

const POLICY_LABEL: Record<PolicyType, string> = {
  [PolicyType.SpendingLimit]: 'Spending limit',
  [PolicyType.Recovery]: 'Account recovery',
  [PolicyType.TokenWithdraw]: 'Token withdraw allowlist',
  [PolicyType.Cosigner]: 'Cosigner',
  [PolicyType.Allow]: 'Allow by default',
  [PolicyType.NativeTransfer]: 'Native transfers',
  [PolicyType.Deny]: 'Deny by default',
  [PolicyType.Proposer]: 'Proposer',
  [PolicyType.MultiSend]: 'Batched transactions',
}

/** Falls back to the raw wire value so a policy type we don't know yet still labels its row. */
export const labelOf = (type: PolicyType): string => POLICY_LABEL[type] ?? type

export type PolicyToken = { address: string; symbol: string; logoUri?: string | null }

/**
 * The tokens a policy is scoped to, for a visual cue on the row. Empty for other types.
 *
 * Only spending limits carry token metadata; the allowlist sends bare addresses, so those
 * rows get an empty symbol and the badge falls back to the address.
 */
export const tokensOf = (policy: ActivePolicy): PolicyToken[] => {
  if (policy.type === PolicyType.TokenWithdraw) {
    return policy.data.allowlist.map((entry) => ({ address: entry.tokenAddress, symbol: '' }))
  }

  if (policy.type === PolicyType.SpendingLimit) {
    return policy.data.spenders.flatMap((spender) =>
      spender.allowances.map((allowance) => ({
        address: allowance.tokenAddress,
        symbol: allowance.tokenMetadata?.symbol ?? '',
        logoUri: allowance.tokenMetadata?.logoUri,
      })),
    )
  }

  return []
}

const tokenLabel = (token: PolicyToken) => token.symbol || shortenAddress(token.address)

const allowanceCount = (policy: Extract<ActivePolicy, { type: PolicyType.SpendingLimit }>): number =>
  policy.data.spenders.reduce((n, spender) => n + spender.allowances.length, 0)

const recipientCount = (policy: Extract<ActivePolicy, { type: PolicyType.TokenWithdraw }>): number =>
  policy.data.allowlist.reduce((n, entry) => n + entry.recipients.length, 0)

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
      const tokens = tokensOf(policy).map(tokenLabel)
      return tokens.length > 0 ? tokens.join(' · ') : 'Any token'
    }
    case PolicyType.SpendingLimit: {
      const spenders = policy.data.spenders.map((spender) => shortenAddress(spender.spender))
      return spenders.length > 0 ? spenders.join(' · ') : 'Spending limit'
    }
    case PolicyType.Recovery:
      return policy.data.recoverers[0] ? shortenAddress(policy.data.recoverers[0]) : 'Recovery'
    case PolicyType.Cosigner:
      return shortenAddress(policy.data.cosignerAddress)
    case PolicyType.Proposer: {
      const proposers = policy.data.proposers.map((entry) => shortenAddress(entry.proposer))
      return proposers.length > 0 ? proposers.join(' · ') : 'Proposer'
    }
    case PolicyType.Allow: {
      // AllowPolicy on the Safe's own management selectors is what a Safe-management policy
      // is made of, so name the function rather than calling it a catch-all.
      const managed = safeManagementFunctionOf(policy)
      if (managed) return managed.label

      if (isFallbackActivePolicy(policy)) return 'Any transaction'

      const access = accessOf(policy)
      return access ? `${shortenAddress(access.target)} · ${access.selector}` : 'Any transaction'
    }
    default:
      // A type the union doesn't know yet still gets a readable label at runtime.
      return labelOf((policy as ActivePolicy).type)
  }
}

/** The entry's detail, minus whatever {@link entryLabelOf} already says. */
export const entrySummaryOf = (policy: ActivePolicy): string => {
  switch (policy.type) {
    case PolicyType.TokenWithdraw: {
      const recipients = recipientCount(policy)
      return `${recipients} allowed ${recipients === 1 ? 'recipient' : 'recipients'}`
    }
    case PolicyType.SpendingLimit: {
      const count = allowanceCount(policy)
      return `${count} token ${count === 1 ? 'limit' : 'limits'}`
    }
    case PolicyType.Recovery: {
      const count = policy.data.recoverers.length
      return count > 1 ? `${count} recoverers` : ''
    }
    case PolicyType.Proposer: {
      const count = policy.data.proposers.length
      return count > 1 ? `${count} proposers` : ''
    }
    case PolicyType.Allow: {
      const managed = safeManagementFunctionOf(policy)
      if (managed) return managed.description

      return isFallbackActivePolicy(policy) ? 'No restrictions' : ''
    }
    default:
      return ''
  }
}

/** One-line description of a configured policy. Empty when the type carries no data. */
export const summarize = (policy: ActivePolicy): string => {
  switch (policy.type) {
    case PolicyType.SpendingLimit: {
      const spenders = policy.data.spenders.length
      return `${spenders} spender(s) · ${allowanceCount(policy)} token limit(s)`
    }
    case PolicyType.Recovery:
      return `${policy.data.recoverers.length} recoverer(s)`
    case PolicyType.TokenWithdraw:
      return `${policy.data.allowlist.length} token(s) · ${recipientCount(policy)} allowed recipient(s)`
    case PolicyType.Cosigner:
      return `Cosigner ${shortenAddress(policy.data.cosignerAddress)}`
    case PolicyType.Proposer:
      return `${policy.data.proposers.length} proposer(s)`
    // The guard's catch-all entries carry no data to summarise.
    default:
      return ''
  }
}
