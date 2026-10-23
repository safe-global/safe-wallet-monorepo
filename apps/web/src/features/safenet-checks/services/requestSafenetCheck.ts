import { apiSliceWithChainsConfig, chainsAdapter } from '@safe-global/store/gateway'
import { getHttpStatusFromError } from '@safe-global/utils/services/exceptions/utils'
import { cgwApi as safenetApi } from '@safe-global/store/gateway/AUTO_GENERATED/safenet'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { Errors, logError } from '@/services/exceptions'
import { getLocationSpaceId, isLegacySpaceId, parseSpaceId } from '@/hooks/useUrlSpaceId'
import { getStoreInstance, type RootState } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

// Refusals, not faults: 403 Workspace refused, 429 daily limit, 501 chain off
const EXPECTED_REFUSALS: ReadonlyArray<number | undefined> = [403, 429, 501]

// Reads the loaded chain config only; it never starts a fetch
const isEnabledOnChain = (state: RootState, chainId: string): boolean => {
  const { data } = apiSliceWithChainsConfig.endpoints.getChainsConfigV2.select(CONFIG_SERVICE_KEY)(state)
  const chain = data ? chainsAdapter.getSelectors().selectById(data, chainId) : undefined
  return chain !== undefined && hasFeature(chain, FEATURES.SAFENET_CHECKS)
}

/** Asks CGW to start a check paid by the Workspace in the page URL. Never rejects: signing must not depend on it. */
export const requestSafenetCheck = async ({
  chainId,
  safeAddress,
  safeTxHash,
}: {
  chainId: string
  safeAddress: string
  safeTxHash: string
}): Promise<void> => {
  try {
    const store = getStoreInstance()
    const state = store.getState()
    const spaceId = parseSpaceId(getLocationSpaceId())
    // CGW accepts only a Workspace UUID in the route
    if (!spaceId || isLegacySpaceId(spaceId)) return
    if (!isAuthenticated(state) || !isEnabledOnChain(state, chainId)) return

    const check = { spaceId, chainId, safeAddress, createSafenetCheckDto: { safeTxHash } }
    await store.dispatch(safenetApi.endpoints.safenetChecksRequestCheckV1.initiate(check)).unwrap()
  } catch (error) {
    if (!EXPECTED_REFUSALS.includes(getHttpStatusFromError(error))) logError(Errors._652, error)
  }
}
