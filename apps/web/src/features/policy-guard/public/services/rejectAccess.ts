import { OperationType } from '@safe-global/types-kit'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { NATIVE_TRANSFER_SELECTOR } from '@safe-global/utils/features/policy-guard/constants'
import type { PolicyConfiguration } from '../types'

// A reject transaction has no data, so it reaches the Safe's receive() under the empty selector
export const REJECT_SELECTOR = NATIVE_TRANSFER_SELECTOR

/** The access a reject transaction needs: the Safe calling itself with no data, which uses up the nonce. */
export const isRejectAccess = (
  { target, selector, operation }: Pick<PolicyConfiguration, 'target' | 'selector' | 'operation'>,
  safeAddress: string,
): boolean =>
  sameAddress(target, safeAddress) && selector.toLowerCase() === REJECT_SELECTOR && operation === OperationType.Call
