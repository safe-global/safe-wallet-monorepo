import { AppRoutes } from '@/config/routes'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { getExplorerLink } from './gateway'
import { type SafeVersion } from '@safe-global/safe-core-sdk-types'
import { getSafeSingletonDeployment } from '@safe-global/safe-deployments'
import semverSatisfies from 'semver/functions/satisfies'
import { LATEST_SAFE_VERSION } from '@/config/constants'

/** This version is used if a network does not have the LATEST_SAFE_VERSION deployed yet */
const FALLBACK_SAFE_VERSION = '1.3.0' as const

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
  NATIVE_SWAPS_USE_COW_STAGING_SERVER = 'NATIVE_SWAPS_USE_COW_STAGING_SERVER',
  NATIVE_SWAPS_FEE_ENABLED = 'NATIVE_SWAPS_FEE_ENABLED',
  ZODIAC_ROLES = 'ZODIAC_ROLES',
  STAKING = 'STAKING',
  STAKING_BANNER = 'STAKING_BANNER',
  MULTI_CHAIN_SAFE_CREATION = 'MULTI_CHAIN_SAFE_CREATION',
  MULTI_CHAIN_SAFE_ADD_NETWORK = 'MULTI_CHAIN_SAFE_ADD_NETWORK',
  PROPOSERS = 'PROPOSERS',
  TARGETED_SURVEY = 'TARGETED_SURVEY',
  BRIDGE = 'BRIDGE',
  RENEW_NOTIFICATIONS_TOKEN = 'RENEW_NOTIFICATIONS_TOKEN',
  TX_NOTES = 'TX_NOTES',
  NESTED_SAFES = 'NESTED_SAFES',
  TARGETED_MASS_PAYOUTS = 'TARGETED_MASS_PAYOUTS',
}

export const FeatureRoutes = {
  [AppRoutes.apps.index]: FEATURES.SAFE_APPS,
  [AppRoutes.swap]: FEATURES.NATIVE_SWAPS,
  [AppRoutes.stake]: FEATURES.STAKING,
  [AppRoutes.balances.nfts]: FEATURES.ERC721,
  [AppRoutes.settings.notifications]: FEATURES.PUSH_NOTIFICATIONS,
  [AppRoutes.bridge]: FEATURES.BRIDGE,
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

export const getLatestSafeVersion = (chain: ChainInfo | undefined, isUpgrade = false): SafeVersion => {
  const latestSafeVersion = isUpgrade
    ? chain?.recommendedMasterCopyVersion || LATEST_SAFE_VERSION // for upgrades, use the recommended version
    : LATEST_SAFE_VERSION // for Safe creation, always use the latest version

  // Without version filter it will always return the LATEST_SAFE_VERSION constant to avoid automatically updating to the newest version if the deployments change
  const latestDeploymentVersion = (getSafeSingletonDeployment({ network: chain?.chainId, released: true })?.version ??
    FALLBACK_SAFE_VERSION) as SafeVersion

  // The version needs to be smaller or equal to the
  if (semverSatisfies(latestDeploymentVersion, `<=${latestSafeVersion}`)) {
    return latestDeploymentVersion
  } else {
    return latestSafeVersion as SafeVersion
  }
}
