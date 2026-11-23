import {
  ALLOWLIST_UNAVAILABLE_ERROR,
  GUARD_NOT_SUPPORTED_ERROR,
  TRANSACTION_TOO_LARGE_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistSetup, PolicyConfiguration, PolicyGuardState } from '../types'
import { estimateConfigurationGas, getConfigurationLimitError, MAX_TRANSACTION_GAS } from './allowlistLimits'
import { withFirstSetupDefaults } from '../../services/firstSetupDefaults'
import { getTokenCallbackHandlerAddress, isTokenCallbackHandler } from './fallbackHandlers'
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
  currentFallbackHandler,
}: {
  chainId: string
  safeAddress: string
  guardAddress: string
  guardState: PolicyGuardState
  configurations: PolicyConfiguration[]
  currentFallbackHandler?: string
}): AllowlistSetup => {
  if (guardState.status === 'unknown' || guardState.status === 'unsupported') {
    throw new Error(GUARD_NOT_SUPPORTED_ERROR)
  }

  const installed = guardState.status === 'none' ? withFirstSetupDefaults(chainId, configurations) : configurations
  const limitError = getConfigurationLimitError(installed)
  if (limitError) throw new Error(limitError)
  if (estimateConfigurationGas(installed) > MAX_TRANSACTION_GAS) {
    throw new Error(TRANSACTION_TOO_LARGE_ERROR)
  }
  const setup = { configurations: installed, root: getConfigurationRoot(installed) }

  if (guardState.status === 'none') {
    const tokenCallbackHandler = getTokenCallbackHandlerAddress(chainId)
    if (!tokenCallbackHandler) throw new Error(ALLOWLIST_UNAVAILABLE_ERROR)
    const fallbackHandler = isTokenCallbackHandler(chainId, currentFallbackHandler) ? undefined : tokenCallbackHandler
    return {
      ...setup,
      txs: createFirstSetupTxs({ safeAddress, guardAddress, configurations: installed, fallbackHandler }),
    }
  }

  const request = createRequestConfigurationTx(guardAddress, setup.root)
  if (guardState.status === 'known') return { ...setup, txs: [request] }

  const setMissingGuard =
    guardState.missingSlot === 'transaction'
      ? createSetGuardTx(safeAddress, guardAddress)
      : createSetModuleGuardTx(safeAddress, guardAddress)
  return { ...setup, txs: [request, setMissingGuard] }
}
