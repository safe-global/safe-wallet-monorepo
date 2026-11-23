import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { PolicyConfiguration } from '../types'
import { getOfficialMultiSendCallOnlyAddresses, MULTI_SEND_SELECTOR } from '../../services/firstSetupDefaults'
import { clearGuardExitConfigurations } from './allowlistConfigurations'
import { FALLBACK_SELECTOR } from './fallbackAccess'

const unbind = (target: string, selector: string, operation: OperationType): PolicyConfiguration => ({
  target,
  selector,
  operation,
  policy: ZERO_ADDRESS,
  data: '0x',
})

/**
 * The second root of a removal: unbinds the Safe setters that the first root allows, and the MultiSend and fallback
 * rules of the first setup, so the guard holds no rule for the Safe once both are applied.
 */
export const buildGuardRemovalCleanupConfigurations = (chainId: string, safeAddress: string): PolicyConfiguration[] => [
  ...clearGuardExitConfigurations(safeAddress),
  ...getOfficialMultiSendCallOnlyAddresses(chainId).map((target) =>
    unbind(target, MULTI_SEND_SELECTOR, OperationType.DelegateCall),
  ),
  ...[OperationType.Call, OperationType.DelegateCall].map((operation) =>
    unbind(ZERO_ADDRESS, FALLBACK_SELECTOR, operation),
  ),
]
