import { AppRoutes } from '@/config/routes'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

export const FeatureRoutes = {
  [AppRoutes.apps.index]: FEATURES.SAFE_APPS,
  [AppRoutes.swap]: FEATURES.NATIVE_SWAPS,
  [AppRoutes.stake]: FEATURES.STAKING,
  [AppRoutes.balances.nfts]: FEATURES.ERC721,
  [AppRoutes.settings.notifications]: FEATURES.PUSH_NOTIFICATIONS,
  [AppRoutes.bridge]: FEATURES.BRIDGE,
}

export const getBlockExplorerLink = (
  chain: ChainInfo,
  address: string,
): { href: string; title: string } | undefined => {
  if (chain.blockExplorerUriTemplate) {
    return getExplorerLink(address, chain.blockExplorerUriTemplate)
  }
}

export const isRouteEnabled = (route: string, chain?: ChainInfo) => {
  if (!chain) return false
  const featureRoute = FeatureRoutes[route]
  return !featureRoute || hasFeature(chain, featureRoute)
}
