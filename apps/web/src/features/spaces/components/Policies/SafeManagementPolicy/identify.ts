import { accessOf, PolicyType, type ActivePolicy } from '@safe-global/store/gateway/policies/types'
import { safeManagementFunctionBySelector, type SafeManagementFunction } from './contracts'

/**
 * Whether an active policy governs one of the Safe's own management functions.
 *
 * Safe management has no policy type of its own: it is AllowPolicy bound to a
 * `(safe, selector, CALL)` access, so on the wire it is indistinguishable from any other
 * `allow` entry except by that access. Three things have to agree — the policy permits
 * (`allow`), the target is the Safe itself, and the selector is a management function —
 * or an AllowPolicy covering some other contract would be read as a Safe setting.
 */
export const safeManagementFunctionOf = (policy: ActivePolicy): SafeManagementFunction | undefined => {
  if (policy.type !== PolicyType.Allow) return undefined

  const access = accessOf(policy)
  if (!access || access.operation !== 'CALL') return undefined
  if (access.target.toLowerCase() !== policy.safe.address.toLowerCase()) return undefined

  return safeManagementFunctionBySelector(access.selector)
}

export const isSafeManagementPolicy = (policy: ActivePolicy): boolean => !!safeManagementFunctionOf(policy)
