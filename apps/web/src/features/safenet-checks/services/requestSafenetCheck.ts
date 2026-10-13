import { apiSliceWithChainsConfig, chainsAdapter } from '@safe-global/store/gateway'
import { safenetChecksApi, type SafenetCheckRequestArg } from '@safe-global/store/gateway/safenetChecks'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { Errors, logError } from '@/services/exceptions'
import { isForbidden } from '@/services/sessionExpiry/expireSession'
import { getStoreInstance, type RootState } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

// Reads the loaded chain config only; it never starts a fetch
const isEnabledOnChain = (state: RootState, chainId: string): boolean => {
  const { data } = apiSliceWithChainsConfig.endpoints.getChainsConfigV2.select(CONFIG_SERVICE_KEY)(state)
  const chain = data ? chainsAdapter.getSelectors().selectById(data, chainId) : undefined
  return chain !== undefined && hasFeature(chain, FEATURES.SAFENET_CHECKS)
}

/** Asks CGW to start a sponsored check. Never rejects, so a failure cannot affect the signing flow. */
export const requestSafenetCheck = async (arg: SafenetCheckRequestArg): Promise<void> => {
  try {
    const store = getStoreInstance()
    const state = store.getState()
    if (!isAuthenticated(state) || !isEnabledOnChain(state, arg.chainId)) return

    await store.dispatch(safenetChecksApi.endpoints.safenetChecksRequestCheck.initiate(arg)).unwrap()
  } catch (error) {
    // CGW answers 403 for a Safe that no eligible Workspace holds; that is not a fault
    if (!isForbidden(error)) logError(Errors._652, error)
  }
}
