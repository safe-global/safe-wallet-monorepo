import semverSatisfies from 'semver/functions/satisfies'
import {
  getSafeSingletonDeployment,
  getSafeL2SingletonDeployment,
  getMultiSendCallOnlyDeployment,
  getMultiSendDeployment,
  getFallbackHandlerDeployment,
  getProxyFactoryDeployment,
  getSignMessageLibDeployment,
  getCreateCallDeployment,
} from '@safe-global/safe-deployments'
import type { SingletonDeployment, DeploymentFilter, SingletonDeploymentV2 } from '@safe-global/safe-deployments'
import type { ChainInfo, SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { type SafeVersion } from '@safe-global/safe-core-sdk-types'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'

const toNetworkAddressList = (addresses: string | string[]) => (Array.isArray(addresses) ? addresses : [addresses])

export const hasCanonicalDeployment = (deployment: SingletonDeploymentV2 | undefined, chainId: string) => {
  const canonicalAddress = deployment?.deployments.canonical?.address

  if (!canonicalAddress) {
    return false
  }

  const networkAddresses = toNetworkAddressList(deployment.networkAddresses[chainId])

  return networkAddresses.some((networkAddress) => sameAddress(canonicalAddress, networkAddress))
}

/**
 * Checks if any of the deployments returned by the `getDeployments` function for the given `network` and `versions` contain a deployment for the `contractAddress`
 *
 * @param getDeployments function to get the contract deployments
 * @param contractAddress address that should be included in the deployments
 * @param network chainId that is getting checked
 * @param versions supported Safe versions
 * @returns true if a matching deployment was found
 */
export const hasMatchingDeployment = (
  getDeployments: (filter?: DeploymentFilter) => SingletonDeploymentV2 | undefined,
  contractAddress: string,
  network: string,
  versions: SafeVersion[],
): boolean => {
  return versions.some((version) => {
    const deployments = getDeployments({ version, network })
    if (!deployments) {
      return false
    }
    const deployedAddresses = toNetworkAddressList(deployments.networkAddresses[network] ?? [])
    return deployedAddresses.some((deployedAddress) => sameAddress(deployedAddress, contractAddress))
  })
}

export const _tryDeploymentVersions = (
  getDeployment: (filter?: DeploymentFilter) => SingletonDeployment | undefined,
  network: ChainInfo,
  version: SafeInfo['version'],
): SingletonDeployment | undefined => {
  // Unsupported Safe version
  if (version === null) {
    // Assume latest version as fallback
    return getDeployment({
      version: getLatestSafeVersion(network),
      network: network.chainId,
    })
  }

  // Supported Safe version
  return getDeployment({
    version,
    network: network.chainId,
  })
}

export const _isLegacy = (safeVersion: SafeInfo['version']): boolean => {
  const LEGACY_VERSIONS = '<=1.0.0'
  return !!safeVersion && semverSatisfies(safeVersion, LEGACY_VERSIONS)
}

export const _isL2 = (chain: ChainInfo, safeVersion: SafeInfo['version']): boolean => {
  const L2_VERSIONS = '>=1.3.0'

  // Unsupported safe version
  if (safeVersion === null) {
    return chain.l2
  }

  // We had L1 contracts on xDai, EWC and Volta so we also need to check version is after 1.3.0
  return chain.l2 && semverSatisfies(safeVersion, L2_VERSIONS)
}

export const getSafeContractDeployment = (
  chain: ChainInfo,
  safeVersion: SafeInfo['version'],
): SingletonDeployment | undefined => {
  // Check if prior to 1.0.0 to keep minimum compatibility
  if (_isLegacy(safeVersion)) {
    return getSafeSingletonDeployment({ version: '1.0.0' })
  }

  const getDeployment = _isL2(chain, safeVersion) ? getSafeL2SingletonDeployment : getSafeSingletonDeployment

  return _tryDeploymentVersions(getDeployment, chain, safeVersion)
}

export const getMultiSendCallOnlyContractDeployment = (chain: ChainInfo, safeVersion: SafeInfo['version']) => {
  return _tryDeploymentVersions(getMultiSendCallOnlyDeployment, chain, safeVersion)
}

export const getMultiSendContractDeployment = (chain: ChainInfo, safeVersion: SafeInfo['version']) => {
  return _tryDeploymentVersions(getMultiSendDeployment, chain, safeVersion)
}

export const getFallbackHandlerContractDeployment = (chain: ChainInfo, safeVersion: SafeInfo['version']) => {
  return _tryDeploymentVersions(getFallbackHandlerDeployment, chain, safeVersion)
}

export const getProxyFactoryContractDeployment = (chain: ChainInfo, safeVersion: SafeInfo['version']) => {
  return _tryDeploymentVersions(getProxyFactoryDeployment, chain, safeVersion)
}

export const getSignMessageLibContractDeployment = (chain: ChainInfo, safeVersion: SafeInfo['version']) => {
  return _tryDeploymentVersions(getSignMessageLibDeployment, chain, safeVersion)
}

export const getCreateCallContractDeployment = (chain: ChainInfo, safeVersion: SafeInfo['version']) => {
  return _tryDeploymentVersions(getCreateCallDeployment, chain, safeVersion)
}
