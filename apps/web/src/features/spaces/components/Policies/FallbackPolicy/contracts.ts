import { PolicyType } from '@safe-global/store/gateway/policies/types'

/**
 * The policies that occupy the guard's single fallback access — the key with neither
 * target nor selector, which catches anything no other access matches.
 *
 * All three take NO configuration payload:
 *
 *   // AllowPolicy, DenyPolicy
 *   function configure(address, AccessSelector.T, bytes memory) external pure returns (bool) {
 *     return true;
 *   }
 *
 *   // NativeTransferPolicy — no payload either, but it rejects the access unless it is
 *   // a plain value transfer:
 *   function configure(address, AccessSelector.T access, bytes memory) external pure returns (bool) {
 *     return access.getSelector() == bytes4(0) && access.getOperation() == Operation.CALL;
 *   }
 *
 * Source: safe-research/policy-engine — contracts/policies/{Allow,Deny,NativeTransfer}Policy.sol.
 */
export type FallbackPolicyType = PolicyType.Allow | PolicyType.Deny | PolicyType.NativeTransfer

export const FALLBACK_POLICY_TYPES: FallbackPolicyType[] = [
  PolicyType.Allow,
  PolicyType.NativeTransfer,
  PolicyType.Deny,
]

export const isFallbackPolicyType = (type: string): type is FallbackPolicyType =>
  FALLBACK_POLICY_TYPES.includes(type as FallbackPolicyType)

/** None of the three reads its `data`, so the payload is always empty. */
export const FALLBACK_POLICY_DATA = '0x'

/**
 * What installing each one means, in the user's terms. Deny is destructive: with it in the
 * fallback slot, every call no other policy covers reverts — including `setGuard`, which
 * the guard does NOT exempt. Only `invalidateRoot`, `requestConfiguration` and
 * `applyConfiguration` on the guard stay callable, so recovery means requesting a new
 * configuration and applying it after the delay.
 */
export const FALLBACK_POLICY_COPY: Record<
  FallbackPolicyType,
  { title: string; effect: string; isDestructive: boolean }
> = {
  [PolicyType.Allow]: {
    title: 'Allow by default',
    effect: 'Any call this Safe makes that no other policy covers will be permitted.',
    isDestructive: false,
  },
  [PolicyType.NativeTransfer]: {
    title: 'Native transfers',
    effect: 'Plain value transfers are governed by this policy. It only accepts calls that carry no function data.',
    isDestructive: false,
  },
  [PolicyType.Deny]: {
    title: 'Deny by default',
    effect: 'Any call this Safe makes that no other policy covers will be blocked.',
    isDestructive: true,
  },
}
