import {
  ALLOWLIST_UNAVAILABLE_ERROR,
  GUARD_NOT_SUPPORTED_ERROR,
  TOO_MANY_CONFIGURATIONS_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistSetup, PolicyConfiguration, PolicyGuardState, TokenApprovalToRevoke } from '../types'
import { MAX_POLICY_CONFIGURATIONS } from './allowlistConfigurations'
import { withFirstSetupDefaults } from '../../services/firstSetupDefaults'
import { getTokenCallbackHandlerAddress, isTokenCallbackHandler } from './fallbackHandlers'
import {
  createFirstSetupTxs,
  createRequestConfigurationTx,
  createRevokeApprovalTx,
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
  revokedApprovals = [],
}: {
  chainId: string
  safeAddress: string
  guardAddress: string
  guardState: PolicyGuardState
  configurations: PolicyConfiguration[]
  currentFallbackHandler?: string
  /** Set to zero at the start of a first setup. */
  revokedApprovals?: TokenApprovalToRevoke[]
}): AllowlistSetup => {
  if (guardState.status === 'unknown' || guardState.status === 'unsupported') {
    throw new Error(GUARD_NOT_SUPPORTED_ERROR)
  }

  const installed = guardState.status === 'none' ? withFirstSetupDefaults(chainId, configurations) : configurations
  if (installed.length > MAX_POLICY_CONFIGURATIONS) throw new Error(TOO_MANY_CONFIGURATIONS_ERROR)
  const setup = { configurations: installed, root: getConfigurationRoot(installed) }

  if (guardState.status === 'none') {
    const tokenCallbackHandler = getTokenCallbackHandlerAddress(chainId)
    if (!tokenCallbackHandler) throw new Error(ALLOWLIST_UNAVAILABLE_ERROR)
    const fallbackHandler = isTokenCallbackHandler(chainId, currentFallbackHandler) ? undefined : tokenCallbackHandler
    return {
      ...setup,
      txs: [
        ...revokedApprovals.map(createRevokeApprovalTx),
        ...createFirstSetupTxs({ safeAddress, guardAddress, configurations: installed, fallbackHandler }),
      ],
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
