import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { NATIVE_TRANSFER_SELECTOR } from '@safe-global/utils/features/policy-guard/constants'
import type { PolicyConfiguration } from '../types'

// The catch-all access shares the native transfer's empty selector; the zero target sets it apart
export const FALLBACK_SELECTOR = NATIVE_TRANSFER_SELECTOR

/** The access the guard falls back to when nothing else matches; each operation has its own. */
export const isFallbackAccess = ({ target, selector }: Pick<PolicyConfiguration, 'target' | 'selector'>): boolean =>
  sameAddress(target, ZERO_ADDRESS) && selector.toLowerCase() === FALLBACK_SELECTOR
