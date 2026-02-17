import semverSatisfies from 'semver/functions/satisfies'
import {
  getSafeSingletonDeployment,
  getSafeL2SingletonDeployment,
  getMultiSendCallOnlyDeployment,
  getMultiSendCallOnlyDeployments,
  getMultiSendDeployment,
  getMultiSendDeployments,
  getFallbackHandlerDeployment,
  getProxyFactoryDeployment,
  getSignMessageLibDeployment,
  getCreateCallDeployment,
} from '@safe-global/safe-deployments'
import type { SingletonDeployment, DeploymentFilter, SingletonDeploymentV2 } from '@safe-global/safe-deployments'
import { _SAFE_L2_DEPLOYMENTS } from '@safe-global/safe-deployments/dist/deployments'
import type { SingletonDeploymentJSON } from '@safe-global/safe-deployments/dist/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { type SafeVersion } from '@safe-global/types-kit'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { ZKSYNC_ERA_CHAIN_ID } from '@safe-global/utils/config/chains'

const toNetworkAddressList = (addresses: string | string[]) => (Array.isArray(addresses) ? addresses : [addresses])

type DeploymentRecord = Record<string, { address: string; codeHash: string }>

const SAFE_L2_CODE_HASHES = new Set<string>(
  (_SAFE_L2_DEPLOYMENTS as SingletonDeploymentJSON[]).flatMap((deployment) =>
    Object.values(deployment.deployments as DeploymentRecord).map(({ codeHash }) => codeHash.toLowerCase()),
  ),
)

const SUPPORTED_ZKSYNC_CANONICAL_CHAIN_IDS = new Set([ZKSYNC_ERA_CHAIN_ID])

export const isL2MasterCopyCodeHash = (codeHash: string | undefined): boolean => {
  if (!codeHash) {
    return false
  }

  return SAFE_L2_CODE_HASHES.has(codeHash.toLowerCase())
}

export const getL2MasterCopyVersionByCodeHash = (codeHash: string | undefined): string | undefined => {
  if (!codeHash) {
    return
  }

  const normalizedCodeHash = codeHash.toLowerCase()

  const matchingDeployment = (_SAFE_L2_DEPLOYMENTS as SingletonDeploymentJSON[]).find((deployment) =>
    Object.values(deployment.deployments as DeploymentRecord).some(
      ({ codeHash }) => codeHash.toLowerCase() === normalizedCodeHash,
    ),
  )

  if (!matchingDeployment) {
    return
  }

  return `${matchingDeployment.version}+L2`
}

export const hasCanonicalDeployment = (deployment: SingletonDeploymentV2 | undefined, chainId: string) => {
  const canonicalAddress = deployment?.deployments.canonical?.address

  if (!canonicalAddress) {
    return false
  }

  const networkAddresses = toNetworkAddressList(deployment.networkAddresses[chainId])

  return networkAddresses.some((networkAddress) => sameAddress(canonicalAddress, networkAddress))
}

/**
 * Returns the canonical address for a deployment on a given network if available and present,
 * otherwise returns the first network-specific address. Undefined if no deployment.
 */
export const getCanonicalOrFirstAddress = (
  deployment: SingletonDeploymentV2 | undefined,
  chainId: string,
): string | undefined => {
  if (!deployment) return undefined

  if (hasCanonicalDeployment(deployment, chainId)) {
    return deployment.deployments.canonical?.address
  }

  const addresses = toNetworkAddressList(deployment.networkAddresses[chainId] ?? [])
  return addresses[0]
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
  network: Chain,
  version: SafeState['version'],
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

export const _isLegacy = (safeVersion: SafeState['version']): boolean => {
  const LEGACY_VERSIONS = '<=1.0.0'
  return !!safeVersion && semverSatisfies(safeVersion, LEGACY_VERSIONS)
}

export const _isL2 = (chain: Chain, safeVersion: SafeState['version']): boolean => {
  const L2_VERSIONS = '>=1.3.0'

  // Unsupported safe version
  if (typeof safeVersion === 'undefined' || safeVersion === null) {
    return chain.l2
  }

  // We had L1 contracts on xDai, EWC and Volta so we also need to check version is after 1.3.0
  return chain.l2 && semverSatisfies(safeVersion, L2_VERSIONS)
}

export const getSafeContractDeployment = (
  chain: Chain,
  safeVersion: SafeState['version'],
): SingletonDeployment | undefined => {
  // Check if prior to 1.0.0 to keep minimum compatibility
  if (_isLegacy(safeVersion)) {
    return getSafeSingletonDeployment({ version: '1.0.0' })
  }

  const getDeployment = _isL2(chain, safeVersion) ? getSafeL2SingletonDeployment : getSafeSingletonDeployment

  return _tryDeploymentVersions(getDeployment, chain, safeVersion)
}

export const getMultiSendCallOnlyContractDeployment = (chain: Chain, safeVersion: SafeState['version']) => {
  return _tryDeploymentVersions(getMultiSendCallOnlyDeployment, chain, safeVersion)
}

export const getMultiSendContractDeployment = (chain: Chain, safeVersion: SafeState['version']) => {
  return _tryDeploymentVersions(getMultiSendDeployment, chain, safeVersion)
}

export const getFallbackHandlerContractDeployment = (chain: Chain, safeVersion: SafeState['version']) => {
  return _tryDeploymentVersions(getFallbackHandlerDeployment, chain, safeVersion)
}

export const getProxyFactoryContractDeployment = (chain: Chain, safeVersion: SafeState['version']) => {
  return _tryDeploymentVersions(getProxyFactoryDeployment, chain, safeVersion)
}

export const getSignMessageLibContractDeployment = (chain: Chain, safeVersion: SafeState['version']) => {
  return _tryDeploymentVersions(getSignMessageLibDeployment, chain, safeVersion)
}

export const getCreateCallContractDeployment = (chain: Chain, safeVersion: SafeState['version']) => {
  return _tryDeploymentVersions(getCreateCallDeployment, chain, safeVersion)
}

/**
 * zkSync Era uses different bytecode formats:
 * - EVM bytecode (canonical deployments) - standard Solidity compiled
 * - EraVM bytecode (zkSync-specific deployments) - zksolc compiled
 *
 * EVM contracts cannot delegatecall to EraVM contracts, so Safes using canonical
 * mastercopies must use canonical auxiliary contracts (MultiSend, SignMessageLib, etc.)
 */

/**
 * Checks if an implementation address is a canonical (EVM bytecode) Safe deployment on zkSync.
 * On zkSync, canonical deployments have EVM bytecode while zkSync-specific deployments have EraVM bytecode.
 */
export const isCanonicalDeployment = (
  implementationAddress: string,
  chainId: string,
  version: SafeState['version'],
): boolean => {
  // Canonical aux-contract override is currently enabled only for zkSync Era mainnet.
  if (!SUPPORTED_ZKSYNC_CANONICAL_CHAIN_IDS.has(chainId)) {
    return false
  }

  const safeVersion = version ?? '1.3.0'

  // Check L2 singleton deployments
  const l2Deployment = getSafeL2SingletonDeployment({ version: safeVersion, network: chainId })
  if (l2Deployment?.deployments.canonical?.address) {
    if (sameAddress(implementationAddress, l2Deployment.deployments.canonical.address)) {
      return true
    }
  }

  // Check L1 singleton deployments
  const l1Deployment = getSafeSingletonDeployment({ version: safeVersion, network: chainId })
  if (l1Deployment?.deployments.canonical?.address) {
    if (sameAddress(implementationAddress, l1Deployment.deployments.canonical.address)) {
      return true
    }
  }

  return false
}

/**
 * Gets the canonical MultiSendCallOnly address for a given version.
 * Used when a Safe on zkSync uses a canonical (EVM bytecode) mastercopy.
 */
export const getCanonicalMultiSendCallOnlyAddress = (version: SafeState['version']): string | undefined => {
  const safeVersion = version ?? '1.3.0'
  const deployment = getMultiSendCallOnlyDeployments({ version: safeVersion })
  return deployment?.deployments.canonical?.address
}

/**
 * Gets the canonical MultiSend address for a given version.
 * Used when a Safe on zkSync uses a canonical (EVM bytecode) mastercopy.
 */
export const getCanonicalMultiSendAddress = (version: SafeState['version']): string | undefined => {
  const safeVersion = version ?? '1.3.0'
  const deployment = getMultiSendDeployments({ version: safeVersion })
  return deployment?.deployments.canonical?.address
}
