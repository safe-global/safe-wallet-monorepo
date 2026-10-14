import { PolicyType, type ActivePolicy, type PendingPolicy } from '@safe-global/store/gateway/policies/types'
import type { SafeRef } from './safeRefs'
import type { PolicyRequest } from './policyRequestStore'
import type { PolicyDetail } from './PolicyDetailDrawer'

/**
 * Map an active policy to the drawer's detail shape (best-effort per type).
 * Shared by the active and pending lists so both render the same views.
 */
export const toPolicyDetail = (policy: ActivePolicy, safe: SafeRef): PolicyDetail | null => {
  switch (policy.type) {
    case PolicyType.SpendingLimit: {
      // The wire groups allowances under each spender; the drawer lists them flat, with every
      // row carrying its own beneficiary. The top-level one is only the drawer's heading, so
      // the first spender stands in for it.
      const limits = policy.data.spenders.flatMap((spender) =>
        spender.allowances.map((allowance) => ({
          beneficiary: spender.spender,
          token: {
            address: allowance.tokenAddress,
            symbol: allowance.tokenMetadata?.symbol ?? '',
            decimals: allowance.tokenMetadata?.decimals,
          },
          amount: allowance.amount,
          spent: allowance.spent,
          nonce: '0',
          resetTimeMin: String(allowance.resetPeriodMinutes),
          lastResetMin: String(allowance.resetsAtMinute - allowance.resetPeriodMinutes),
        })),
      )

      return {
        type: 'spending-limit',
        beneficiary: policy.data.spenders[0]?.spender ?? '',
        safe,
        limits,
      }
    }
    case PolicyType.Recovery:
      return {
        type: 'recovery',
        recoverer: policy.data.recoverers[0] ?? '',
        safe,
        config: {
          delayModifierAddress: policy.enforcement.via === 'module' ? policy.enforcement.moduleAddress : '',
          recoverers: policy.data.recoverers,
          cooldownSec: BigInt(policy.data.cooldownSec || '0'),
          expirySec: BigInt(policy.data.expirySec || '0'),
        },
      }
    case PolicyType.TokenWithdraw:
      return {
        type: 'erc20-transfer',
        safe,
        // The wire sends bare addresses, so there is no symbol to show.
        allowlist: policy.data.allowlist.map((entry) => ({
          token: { address: entry.tokenAddress, symbol: '' },
          recipients: entry.recipients.map((recipient) => ({ address: recipient.account })),
        })),
      }
    // No dedicated drawer view for cosigner or the stateless catch-all entries.
    case PolicyType.Cosigner:
      return null
    default:
      return null
  }
}

/**
 * The token-withdraw view built from the requester's own snapshot of the change.
 * Only allowlist-shaped requests have one; others fall through to the bindings view.
 */
const toLocalDetail = (local: PolicyRequest, safe: SafeRef): PolicyDetail | null =>
  local.data
    ? {
        type: 'erc20-transfer',
        safe,
        allowlist: local.data.allowlist.map((entry) => ({
          token: { address: entry.token.address, symbol: entry.token.symbol },
          recipients: entry.recipients,
        })),
      }
    : null

/**
 * The drawer content for a pending request, from the richest source available:
 * CGW's decoded policy, then the requester's local snapshot (it carries token
 * symbols and recipient names), then the raw bindings — which is all a CGW that
 * doesn't decode the root can offer.
 */
export const toPendingDetail = ({
  pending,
  local,
  safe,
}: {
  pending: PendingPolicy
  local?: PolicyRequest
  safe: SafeRef
}): PolicyDetail => {
  const decoded = pending.policy ? toPolicyDetail(pending.policy, safe) : null
  if (decoded) return decoded

  const fromLocal = local ? toLocalDetail(local, safe) : null
  if (fromLocal) return fromLocal

  return { type: 'bindings', safe, bindings: pending.policies ?? [] }
}
