import type { JsonRpcProvider } from 'ethers'
import type { SafeTransactionData } from '@safe-global/types-kit'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { cosignerApi } from '@safe-global/store/cosigner/cosignerApi'
import { getStoreInstance } from '@/store'
import { selectCosignerServiceUrls } from '@/store/settingsSlice'
import { resolveCosignerServiceUrl } from '@safe-global/utils/features/policy-cosigner/constants'
import type { CosignerState } from '../types'
import {
  getCosignerRequirement,
  getCosignerServiceErrorMessage,
  getCosignerState,
  getCosignerStateMessage,
  getSafeTxHash,
  getStaticCosignerState,
  isCosignerApplicable,
  isCosignerWaiting,
  toEthCall,
} from './cosignerState'

export class CosignerExecutionError extends Error {
  constructor(
    readonly state: CosignerState,
    /** Set once the tx was proposed before the co-signer blocked it, so it sits in the queue */
    readonly txId?: string,
  ) {
    super(getCosignerStateMessage(state))
    this.name = 'CosignerExecutionError'
  }
}

type WaitOptions = { timeoutMs?: number; intervalMs?: number }

const fetchCosignatures = (serviceUrl: string, safeTxHash: string) =>
  getStoreInstance()
    .dispatch(
      cosignerApi.endpoints.getCosignatures.initiate(
        { serviceUrl, safeTxHash },
        { forceRefetch: true, subscribe: false },
      ),
    )
    .unwrap()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Resolves the policy context to append to `execTransaction` signatures: `undefined` when the
 * Safe's policy guard needs none, otherwise the co-signature, polling the service until it decides.
 * Throws a `CosignerExecutionError` when the co-signer blocks execution or doesn't answer in time.
 */
export const waitForPolicyContext = async (
  safe: Pick<SafeState, 'chainId' | 'address' | 'guard' | 'version'>,
  txData: SafeTransactionData,
  provider: JsonRpcProvider,
  { timeoutMs = 60_000, intervalMs = 2_000 }: WaitOptions = {},
): Promise<string | undefined> => {
  const guard = safe.guard?.value
  const serviceUrl = resolveCosignerServiceUrl(safe.chainId, selectCosignerServiceUrls(getStoreInstance().getState()))
  if (!serviceUrl || !guard || !safe.version || !isCosignerApplicable(serviceUrl, guard)) {
    return undefined
  }

  const call = toEthCall(provider)
  const requirement = await getCosignerRequirement(call, guard, safe.address.value, txData)
  const staticState = getStaticCosignerState(requirement, txData)
  if (staticState?.status === 'notRequired') {
    return undefined
  }
  if (staticState) {
    throw new CosignerExecutionError(staticState)
  }
  if (requirement.mode !== 'single') {
    return undefined
  }

  const safeTxHash = getSafeTxHash(safe.address.value, txData, safe.version, safe.chainId)
  const deadline = Date.now() + timeoutMs

  while (true) {
    const result = await fetchCosignatures(serviceUrl, safeTxHash).catch((error: unknown) => {
      throw new CosignerExecutionError({
        status: 'unavailable',
        reason: getCosignerServiceErrorMessage(error),
        cosigner: requirement.cosigner,
      })
    })
    const state = await getCosignerState(call, requirement.cosigner, safeTxHash, result)
    if (state.status === 'ready') {
      return state.context
    }
    if (!isCosignerWaiting(state) || Date.now() >= deadline) {
      throw new CosignerExecutionError(state)
    }
    await sleep(intervalMs)
  }
}
