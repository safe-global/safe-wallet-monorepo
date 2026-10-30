import {
  GUARD_NOT_SUPPORTED_ERROR,
  TOO_MANY_CONFIGURATIONS_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistSetup, PolicyConfiguration, PolicyGuardState } from '../types'
import { MAX_POLICY_CONFIGURATIONS } from './allowlistConfigurations'
import { withFirstSetupDefaults } from './firstSetupDefaults'
import {
  createFirstSetupTxs,
  createRequestConfigurationTx,
  createSetGuardTx,
  createSetModuleGuardTx,
  getConfigurationRoot,
} from './policyGuardEncoders'

export const createAllowlistSetupTxs = ({
  chainId,
  safeAddress,
  guardAddress,
  guardState,
  configurations,
}: {
  chainId: string
  safeAddress: string
  guardAddress: string
  guardState: PolicyGuardState
  configurations: PolicyConfiguration[]
}): AllowlistSetup => {
  if (guardState.status === 'unknown' || guardState.status === 'unsupported') {
    throw new Error(GUARD_NOT_SUPPORTED_ERROR)
  }

  const installed = guardState.status === 'none' ? withFirstSetupDefaults(chainId, configurations) : configurations
  if (installed.length > MAX_POLICY_CONFIGURATIONS) throw new Error(TOO_MANY_CONFIGURATIONS_ERROR)
  const setup = { configurations: installed, root: getConfigurationRoot(installed) }

  if (guardState.status === 'none') {
    return { ...setup, txs: createFirstSetupTxs({ safeAddress, guardAddress, configurations: installed }) }
  }

  const request = createRequestConfigurationTx(guardAddress, setup.root)
  if (guardState.status === 'known') return { ...setup, txs: [request] }

  const setMissingGuard =
    guardState.missingSlot === 'transaction'
      ? createSetGuardTx(safeAddress, guardAddress)
      : createSetModuleGuardTx(safeAddress, guardAddress)
  return { ...setup, txs: [request, setMissingGuard] }
}
