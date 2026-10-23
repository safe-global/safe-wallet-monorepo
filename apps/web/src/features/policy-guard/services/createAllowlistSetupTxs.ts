import type { MetaTransactionData } from '@safe-global/types-kit'
import { GUARD_NOT_SUPPORTED_ERROR } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { PolicyConfiguration, PolicyGuardState } from '../types'
import {
  createFirstSetupTxs,
  createRequestConfigurationTx,
  createSetGuardTx,
  createSetModuleGuardTx,
  getConfigurationRoot,
} from './policyGuardEncoders'

export const createAllowlistSetupTxs = ({
  safeAddress,
  guardAddress,
  guardState,
  configurations,
}: {
  safeAddress: string
  guardAddress: string
  guardState: PolicyGuardState
  configurations: PolicyConfiguration[]
}): MetaTransactionData[] => {
  const requestTx = () => createRequestConfigurationTx(guardAddress, getConfigurationRoot(configurations))

  switch (guardState.status) {
    case 'none':
      return createFirstSetupTxs({ safeAddress, guardAddress, configurations })
    case 'known':
      return [requestTx()]
    // configureImmediately reverts once our guard is in either slot, so a partial setup must use a request
    case 'partial':
      return [
        requestTx(),
        guardState.missingSlot === 'transaction'
          ? createSetGuardTx(safeAddress, guardAddress)
          : createSetModuleGuardTx(safeAddress, guardAddress),
      ]
    case 'unknown':
    case 'unsupported':
      throw new Error(GUARD_NOT_SUPPORTED_ERROR)
  }
}
