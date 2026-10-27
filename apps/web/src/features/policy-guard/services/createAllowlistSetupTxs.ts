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
  const request = (txs: AllowlistSetup['txs'] = []): AllowlistSetup => {
    const root = getConfigurationRoot(configurations)
    return { txs: [createRequestConfigurationTx(guardAddress, root), ...txs], configurations, root }
  }

  switch (guardState.status) {
    case 'none': {
      const installed = withFirstSetupDefaults(chainId, configurations)
      if (installed.length > MAX_POLICY_CONFIGURATIONS) throw new Error(TOO_MANY_CONFIGURATIONS_ERROR)
      return {
        txs: createFirstSetupTxs({ safeAddress, guardAddress, configurations: installed }),
        configurations: installed,
        root: getConfigurationRoot(installed),
      }
    }
    case 'known':
      return request()
    case 'partial':
      return request([
        guardState.missingSlot === 'transaction'
          ? createSetGuardTx(safeAddress, guardAddress)
          : createSetModuleGuardTx(safeAddress, guardAddress),
      ])
    case 'unknown':
    case 'unsupported':
      throw new Error(GUARD_NOT_SUPPORTED_ERROR)
  }
}
