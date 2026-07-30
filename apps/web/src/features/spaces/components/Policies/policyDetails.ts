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
    case PolicyType.SpendingLimit:
      return {
        type: 'spending-limit',
        beneficiary: policy.data.beneficiary,
        safe,
        limits: policy.data.limits.map((l) => ({
          beneficiary: policy.data.beneficiary,
          token: { address: l.token.address, symbol: l.token.symbol, decimals: l.token.decimals },
          amount: l.amount,
          spent: l.spent,
          nonce: l.nonce,
          resetTimeMin: '0',
          lastResetMin: '0',
        })),
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
        type: 'ERC20TransferPolicy',
        safe,
        allowlist: policy.data.allowlist.map((entry) => ({
          token: { address: entry.token.address, symbol: entry.token.symbol },
          recipients: entry.recipients,
        })),
      }
    // No dedicated drawer view for cosigner or the catch-all allow entry.
    case PolicyType.Cosigner:
    case PolicyType.Allow:
      return null
    default:
      return null
  }
}

/** The token-withdraw view built from the requester's own snapshot of the change. */
const toLocalDetail = (local: PolicyRequest, safe: SafeRef): PolicyDetail => ({
  type: 'ERC20TransferPolicy',
  safe,
  allowlist: local.data.allowlist.map((entry) => ({
    token: { address: entry.token.address, symbol: entry.token.symbol },
    recipients: entry.recipients,
  })),
})

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

  if (local) return toLocalDetail(local, safe)

  return { type: 'bindings', safe, bindings: pending.policies ?? [] }
}
