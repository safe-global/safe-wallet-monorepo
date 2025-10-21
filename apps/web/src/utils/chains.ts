import { AppRoutes } from '@/config/routes'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { getStoreInstance } from '@/store'

export const FeatureRoutes = {
  [AppRoutes.apps.index]: FEATURES.SAFE_APPS,
  [AppRoutes.swap]: FEATURES.NATIVE_SWAPS,
  [AppRoutes.stake]: FEATURES.STAKING,
  [AppRoutes.balances.nfts]: FEATURES.ERC721,
  [AppRoutes.settings.notifications]: FEATURES.PUSH_NOTIFICATIONS,
  [AppRoutes.bridge]: FEATURES.BRIDGE,
  [AppRoutes.earn]: FEATURES.EARN,
  [AppRoutes.balances.positions]: FEATURES.POSITIONS,
}

export const getBlockExplorerLink = (chain: Chain, address: string): { href: string; title: string } | undefined => {
  if (chain.blockExplorerUriTemplate) {
    return getExplorerLink(address, chain.blockExplorerUriTemplate)
  }
}

export const isRouteEnabled = (route: string, chain?: Chain) => {
  if (!chain) return false
  const featureRoute = FeatureRoutes[route]
  return !featureRoute || hasFeature(chain, featureRoute)
}

/**
 * Fetches chain configuration using RTK Query
 * @param chainId - The chain ID to fetch configuration for
 * @returns Promise that resolves to the Chain configuration
 * @throws Error if the chain configuration cannot be fetched
 */
export const getChainConfig = async (chainId: string): Promise<Chain> => {
  const store = getStoreInstance()

  const queryThunk = cgwApi.endpoints.chainsGetChainV1.initiate({ chainId })
  const queryAction = store.dispatch(queryThunk)

  try {
    return await queryAction.unwrap()
  } finally {
    queryAction.unsubscribe()
  }
}
