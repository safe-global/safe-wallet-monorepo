import type { JsonRpcProvider } from 'ethers'
import type { AppDispatch } from '@/store'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import type { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { isSmartContract } from '@/utils/wallets'
import { cgwApi as counterfactualSafesApi } from '@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes'
import { addOrUpdateSafe } from '@/store/addedSafesSlice'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { toBackendDto } from './counterfactualSafeMapper'
import { replayCounterfactualSafeDeployment } from './safeDeployment'
import { removeUndeployedSafe } from '../store/undeployedSafesSlice'

export type SaveCounterfactualSafeArgs = {
  chainId: string
  safeAddress: string
  props: ReplayedSafeProps
  name: string
  payMethod: PayMethod
  /** Signed-out users keep the Safe locally only; nothing is written to the backend. */
  isUserAuthenticated: boolean
  /** Read-only provider for `chainId` for the signed-out deployment check; skipped when absent. */
  provider?: JsonRpcProvider
  dispatch: AppDispatch
}

export type SaveResult = { status: 'saved' } | { status: 'already-deployed' } | { status: 'failed'; error: Error }

/** Saves a counterfactual Safe on one network: to the backend when signed in, then to Redux. */
export const saveCounterfactualSafe = async (args: SaveCounterfactualSafeArgs): Promise<SaveResult> => {
  const { chainId, safeAddress, props, name, payMethod, isUserAuthenticated, provider, dispatch } = args

  // Signed-in users get a 409 from the backend instead; fail open when the RPC check errors.
  if (provider && !isUserAuthenticated && (await isSmartContract(safeAddress, provider).catch(() => false))) {
    return recoverAlreadyDeployed(args)
  }

  if (isUserAuthenticated) {
    const result = await dispatch(
      counterfactualSafesApi.endpoints.counterfactualSafesCreateV1.initiate({
        createCounterfactualSafesDto: { safes: [toBackendDto(chainId, safeAddress, props)] },
      }),
    )
    if ('error' in result) {
      const { error } = result
      if (error && 'status' in error && error.status === 409) return recoverAlreadyDeployed(args)
      const message = (error && getRtkQueryErrorMessage(error)) || 'Failed to save Safe account to backend'
      return { status: 'failed', error: new Error(message) }
    }
  }

  replayCounterfactualSafeDeployment(chainId, safeAddress, props, name, dispatch, payMethod)
  return { status: 'saved' }
}

/** Stores an already deployed Safe as a regular Safe in My accounts and drops any stale undeployed entry. */
function recoverAlreadyDeployed({
  chainId,
  safeAddress,
  props,
  name,
  dispatch,
}: SaveCounterfactualSafeArgs): SaveResult {
  dispatch(
    addOrUpdateSafe({
      safe: {
        ...defaultSafeInfo,
        chainId,
        address: { value: safeAddress, name },
        threshold: Number(props.safeAccountConfig.threshold),
        owners: props.safeAccountConfig.owners.map((owner) => ({ value: owner })),
      },
    }),
  )
  dispatch(removeUndeployedSafe({ chainId, address: safeAddress }))
  return { status: 'already-deployed' }
}
