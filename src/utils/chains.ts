import { AppRoutes } from '@/config/routes'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { getExplorerLink } from './gateway'

export enum FEATURES {
  ERC721 = 'ERC721',
  SAFE_APPS = 'SAFE_APPS',
  DOMAIN_LOOKUP = 'DOMAIN_LOOKUP',
  SPENDING_LIMIT = 'SPENDING_LIMIT',
  EIP1559 = 'EIP1559',
  SAFE_TX_GAS_OPTIONAL = 'SAFE_TX_GAS_OPTIONAL',
  TX_SIMULATION = 'TX_SIMULATION',
  DEFAULT_TOKENLIST = 'DEFAULT_TOKENLIST',
  RELAYING = 'RELAYING',
  EIP1271 = 'EIP1271',
  RISK_MITIGATION = 'RISK_MITIGATION',
  PUSH_NOTIFICATIONS = 'PUSH_NOTIFICATIONS',
  NATIVE_WALLETCONNECT = 'NATIVE_WALLETCONNECT',
  RECOVERY = 'RECOVERY',
  COUNTERFACTUAL = 'COUNTERFACTUAL',
  DELETE_TX = 'DELETE_TX',
  SPEED_UP_TX = 'SPEED_UP_TX',
  SAP_BANNER = 'SAP_BANNER',
  NATIVE_SWAPS = 'NATIVE_SWAPS',
  RELAY_NATIVE_SWAPS = 'RELAY_NATIVE_SWAPS',
  ZODIAC_ROLES = 'ZODIAC_ROLES',
  STAKE = 'STAKE',
}

export const FeatureRoutes = {
  [AppRoutes.apps.index]: FEATURES.SAFE_APPS,
  [AppRoutes.swap]: FEATURES.NATIVE_SWAPS,
  [AppRoutes.balances.nfts]: FEATURES.ERC721,
  [AppRoutes.settings.notifications]: FEATURES.PUSH_NOTIFICATIONS,
  [AppRoutes.stake]: FEATURES.STAKE,
}

export const hasFeature = (chain: ChainInfo, feature: FEATURES): boolean => {
  return (chain.features as string[]).includes(feature)
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
