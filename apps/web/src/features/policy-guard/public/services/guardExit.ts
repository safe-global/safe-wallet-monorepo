import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { MULTISEND_SIGNATURE_HASH } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import type { PolicyConfiguration } from '../types'
import { isFallbackAccess } from './fallbackAccess'
import { isRejectAccess } from './rejectAccess'

export const SET_GUARD_SELECTOR = '0xe19a9dd9'
export const SET_MODULE_GUARD_SELECTOR = '0xe068df37'
export const SET_FALLBACK_HANDLER_SELECTOR = '0xf08a0323'
export const SAFE_SETTER_SELECTORS = [SET_GUARD_SELECTOR, SET_MODULE_GUARD_SELECTOR, SET_FALLBACK_HANDLER_SELECTOR]

/** The Safe's own `setGuard`: only a removal lets it through the guard, so a rule on it marks one. */
export const isSetGuardAccess = (
  { target, selector }: { target: string; selector: string },
  safeAddress: string,
): boolean => sameAddress(target, safeAddress) && selector.toLowerCase() === SET_GUARD_SELECTOR

/** Whether the configurations remove the allowlist, which only a removal's binding of `setGuard` tells apart. */
export const isAllowlistRemoval = (
  configurations: readonly Pick<PolicyConfiguration, 'target' | 'selector' | 'policy'>[],
  safeAddress: string,
): boolean =>
  configurations.some(
    (configuration) => isSetGuardAccess(configuration, safeAddress) && !sameAddress(configuration.policy, ZERO_ADDRESS),
  )

const isSafeAccess = (
  { target, selector }: { target: string; selector: string },
  safeAddress: string,
  expected: string,
) => sameAddress(target, safeAddress) && selector.toLowerCase() === expected

/**
 * Whether the configurations are the second root of a removal: they unbind the Safe's three setters, and nothing
 * else than the MultiSend, reject and fallback rules.
 */
export const isGuardRemovalCleanup = (
  configurations: readonly Pick<PolicyConfiguration, 'target' | 'selector' | 'operation' | 'policy'>[],
  safeAddress: string,
): boolean =>
  SAFE_SETTER_SELECTORS.every((selector) =>
    configurations.some((configuration) => isSafeAccess(configuration, safeAddress, selector)),
  ) &&
  configurations.every(
    (configuration) =>
      sameAddress(configuration.policy, ZERO_ADDRESS) &&
      (SAFE_SETTER_SELECTORS.some((selector) => isSafeAccess(configuration, safeAddress, selector)) ||
        configuration.selector.toLowerCase() === MULTISEND_SIGNATURE_HASH ||
        isRejectAccess(configuration, safeAddress) ||
        isFallbackAccess(configuration)),
  )
