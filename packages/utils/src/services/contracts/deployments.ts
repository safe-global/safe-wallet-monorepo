import semverSatisfies from 'semver/functions/satisfies'
import {
  getSafeSingletonDeployment,
  getSafeSingletonDeployments,
  getSafeL2SingletonDeployment,
  getSafeL2SingletonDeployments,
  getMultiSendCallOnlyDeployment,
  getMultiSendCallOnlyDeployments,
  getMultiSendDeployment,
  getMultiSendDeployments,
  getFallbackHandlerDeployment,
  getCompatibilityFallbackHandlerDeployments,
  getProxyFactoryDeployment,
  getProxyFactoryDeployments,
  getSignMessageLibDeployment,
  getSignMessageLibDeployments,
  getCreateCallDeployment,
  getCreateCallDeployments,
  getSimulateTxAccessorDeployments,
} from '@safe-global/safe-deployments'
import type { SingletonDeployment, DeploymentFilter, SingletonDeploymentV2 } from '@safe-global/safe-deployments'
import type { ContractNetworkConfig } from '@safe-global/protocol-kit'
import { _SAFE_L2_DEPLOYMENTS } from '@safe-global/safe-deployments/dist/deployments'
import type { SingletonDeploymentJSON } from '@safe-global/safe-deployments/dist/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { type SafeVersion } from '@safe-global/types-kit'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { ZKSYNC_ERA_CHAIN_ID } from '@safe-global/utils/config/chains'

const toNetworkAddressList = (addresses: string | string[]) => (Array.isArray(addresses) ? addresses : [addresses])

type DeploymentType = 'canonical' | 'eip155' | 'zksync'
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
 * Returns an address for a deployment.
 *
 * When a non-default `deploymentType` is requested (e.g. `'zksync'`), the type-specific
 * address is returned only if it is actually registered for this chain. This is required
 * on zkSync, where networkAddresses lists both the zkSync (EraVM) and canonical (EVM)
 * addresses together and EraVM Safes cannot delegatecall to EVM auxiliary contracts.
 * Guarding on explicit registration prevents handing back an address that was never
 * deployed on the target chain (same regression shape as #7494).
 *
 * Otherwise, falls back to per-chain lookup (canonical-or-first network address), then to
 * the chain-agnostic deployment-type address for unregistered chains.
 */
export const getChainAgnosticAddress = (
  deployment: SingletonDeploymentV2 | undefined,
  chainId: string,
  deploymentType: DeploymentType = 'canonical',
): string | undefined => {
  if (!deployment) return undefined

  if (deploymentType !== 'canonical') {
    const typeSpecificAddress = deployment.deployments[deploymentType]?.address
    const networkAddresses = toNetworkAddressList(deployment.networkAddresses[chainId] ?? [])
    const isRegisteredOnChain =
      typeSpecificAddress && networkAddresses.some((addr) => sameAddress(addr, typeSpecificAddress))

    if (isRegisteredOnChain) return typeSpecificAddress
  }

  const perChainAddress = getCanonicalOrFirstAddress(deployment, chainId)
  if (perChainAddress) return perChainAddress

  return deployment.deployments[deploymentType]?.address
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

// Newest --> oldest (fallback candidates) starting from the requested version
const CANONICAL_FALLBACK_VERSIONS = ['1.5.0', '1.4.1', '1.3.0'] as const
type CanonicalFallbackVersion = (typeof CANONICAL_FALLBACK_VERSIONS)[number]

const isCanonicalRegisteredOnChain = (deployment: SingletonDeploymentV2 | undefined, chainId: string): boolean => {
  const canonicalAddress = deployment?.deployments.canonical?.address
  if (!canonicalAddress) return false
  const networkAddresses = toNetworkAddressList(deployment.networkAddresses[chainId] ?? [])
  return networkAddresses.some((addr) => sameAddress(addr, canonicalAddress))
}

/**
 * Canonical MultiSendCallOnly address for `chainId` at `version`, falling back to older
 * versions. Returns `undefined` if no canonical is registered on the chain.
 */
export const getCanonicalMultiSendCallOnlyAddress = (
  chainId: string,
  version: SafeState['version'],
): string | undefined => {
  const requested = (version ?? '1.3.0') as CanonicalFallbackVersion
  const startIndex = CANONICAL_FALLBACK_VERSIONS.indexOf(requested)
  const candidates = startIndex >= 0 ? CANONICAL_FALLBACK_VERSIONS.slice(startIndex) : CANONICAL_FALLBACK_VERSIONS

  for (const candidate of candidates) {
    const deployment = getMultiSendCallOnlyDeployments({ version: candidate })
    if (isCanonicalRegisteredOnChain(deployment, chainId)) {
      return deployment!.deployments.canonical!.address
    }
  }

  console.warn(`[MultiSendCallOnly] No canonical registered on chain ${chainId} for v${requested} or older`)
  return undefined
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

type DeploymentGetter = (filter?: DeploymentFilter) => SingletonDeploymentV2 | undefined

type AuxiliaryContractField = keyof Pick<
  ContractNetworkConfig,
  | 'multiSendAddress'
  | 'multiSendCallOnlyAddress'
  | 'safeProxyFactoryAddress'
  | 'fallbackHandlerAddress'
  | 'signMessageLibAddress'
  | 'createCallAddress'
  | 'simulateTxAccessorAddress'
>

const BASE_DEPLOYMENT_GETTERS: Record<AuxiliaryContractField, DeploymentGetter> = {
  multiSendAddress: getMultiSendDeployments,
  multiSendCallOnlyAddress: getMultiSendCallOnlyDeployments,
  safeProxyFactoryAddress: getProxyFactoryDeployments,
  fallbackHandlerAddress: getCompatibilityFallbackHandlerDeployments,
  signMessageLibAddress: getSignMessageLibDeployments,
  createCallAddress: getCreateCallDeployments,
  simulateTxAccessorAddress: getSimulateTxAccessorDeployments,
}

const CHAIN_AGNOSTIC_VERSIONS = '>=1.4.1'

export const isChainAgnosticVersion = (version: string | null | undefined): boolean => {
  if (!version) return false
  const [cleanVersion] = version.split('+')
  return semverSatisfies(cleanVersion, CHAIN_AGNOSTIC_VERSIONS)
}

/**
 * Resolves all contract addresses chain-agnostically by version + deployment type.
 * Works for any chain without needing safe-deployments to register it.
 *
 * Returns undefined only if the singleton address cannot be resolved (critical).
 * Missing auxiliary contracts are logged as warnings and omitted from the result —
 * the SDK will still init but may fail for operations that need the missing contract.
 */
export const resolveChainAgnosticContractAddresses = (
  version: string,
  isL2: boolean,
  isZk: boolean,
): ContractNetworkConfig | undefined => {
  const [cleanVersion] = version.split('+')
  const deploymentType: DeploymentType = isZk ? 'zksync' : 'canonical'

  const singletonGetter: DeploymentGetter = isL2 ? getSafeL2SingletonDeployments : getSafeSingletonDeployments

  // Singleton is critical — cannot proceed without it
  const singletonAddress = singletonGetter({ version: cleanVersion })?.deployments[deploymentType]?.address
  if (!singletonAddress) {
    console.warn(`[resolveChainAgnostic] No singleton address for v${cleanVersion} (${deploymentType}, L2=${isL2})`)
    return undefined
  }

  const resolved: Record<string, string> = { safeSingletonAddress: singletonAddress }
  const missingContracts: string[] = []

  // Resolve auxiliary contracts — missing ones are non-fatal
  for (const [field, getter] of Object.entries(BASE_DEPLOYMENT_GETTERS)) {
    const address = getter({ version: cleanVersion })?.deployments[deploymentType]?.address
    if (address) {
      resolved[field] = address
    } else {
      missingContracts.push(field)
    }
  }

  if (missingContracts.length > 0) {
    console.warn(
      `[resolveChainAgnostic] Missing auxiliary contracts for v${cleanVersion} (${deploymentType}): ${missingContracts.join(', ')}`,
    )
  }

  return resolved as ContractNetworkConfig
}
