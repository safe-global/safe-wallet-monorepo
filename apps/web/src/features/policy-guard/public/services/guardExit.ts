import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { PolicyConfiguration } from '../types'

export const SET_GUARD_SELECTOR = '0xe19a9dd9'
export const SET_MODULE_GUARD_SELECTOR = '0xe068df37'

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
