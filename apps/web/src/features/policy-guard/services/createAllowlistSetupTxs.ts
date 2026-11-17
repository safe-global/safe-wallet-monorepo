import { GUARD_NOT_SUPPORTED_ERROR } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistSetup, PolicyConfiguration, PolicyGuardState } from '../types'
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
}): AllowlistSetup => {
  const root = getConfigurationRoot(configurations)
  const withTxs = (txs: AllowlistSetup['txs']): AllowlistSetup => ({ txs, configurations, root })
  const requestTx = () => createRequestConfigurationTx(guardAddress, root)

  switch (guardState.status) {
    case 'none':
      return withTxs(createFirstSetupTxs({ safeAddress, guardAddress, configurations }))
    case 'known':
      return withTxs([requestTx()])
    case 'partial':
      return withTxs([
        requestTx(),
        guardState.missingSlot === 'transaction'
          ? createSetGuardTx(safeAddress, guardAddress)
          : createSetModuleGuardTx(safeAddress, guardAddress),
      ])
    case 'unknown':
    case 'unsupported':
      throw new Error(GUARD_NOT_SUPPORTED_ERROR)
  }
}
