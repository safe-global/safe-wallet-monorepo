import { apiSliceWithChainsConfig, chainsAdapter } from '@safe-global/store/gateway'
import { getHttpStatusFromError } from '@safe-global/utils/services/exceptions/utils'
import { cgwApi as safenetApi } from '@safe-global/store/gateway/AUTO_GENERATED/safenet'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { Errors, logError } from '@/services/exceptions'
import { getLocationSpaceId, isLegacySpaceId, parseSpaceId } from '@/hooks/useUrlSpaceId'
import { getStoreInstance, type RootState } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

// 402: the Workspace plan does not include checks. 403: this Workspace cannot check the Safe.
// 501: CGW's chain config does not offer checks yet, while this tab's config still does.
// None is a fault.
const EXPECTED_REFUSALS: ReadonlyArray<number | undefined> = [402, 403, 501]

// Reads the loaded chain config only; it never starts a fetch
const isEnabledOnChain = (state: RootState, chainId: string): boolean => {
  const { data } = apiSliceWithChainsConfig.endpoints.getChainsConfigV2.select(CONFIG_SERVICE_KEY)(state)
  const chain = data ? chainsAdapter.getSelectors().selectById(data, chainId) : undefined
  return chain !== undefined && hasFeature(chain, FEATURES.SAFENET_CHECKS)
}

/**
 * Asks CGW to start a check that the Workspace in the page URL sponsors, as for relay; outside a
 * Workspace nothing is sent. Never rejects, so a failure cannot affect the signing flow.
 */
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
