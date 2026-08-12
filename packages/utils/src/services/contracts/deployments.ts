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
  getExtensibleFallbackHandlerDeployments,
  getProxyFactoryDeployment,
  getProxyFactoryDeployments,
  getSignMessageLibDeployment,
  getSignMessageLibDeployments,
  getCreateCallDeployment,
  getCreateCallDeployments,
  getSafeToL2SetupDeployment,
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
const toNetworkAddressList = (addresses: string | string[]) => (Array.isArray(addresses) ? addresses : [addresses])

export type DeploymentType = 'canonical' | 'eip155' | 'zksync'
type DeploymentRecord = Record<string, { address: string; codeHash: string }>

const SAFE_L2_CODE_HASHES = new Set<string>(
  (_SAFE_L2_DEPLOYMENTS as SingletonDeploymentJSON[]).flatMap((deployment) =>
    Object.values(deployment.deployments as DeploymentRecord).map(({ codeHash }) => codeHash.toLowerCase()),
  ),
)

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
 * Returns an address for a deployment, preferring the requested deploymentType when
 * it is actually registered for the chainId, falling back to the chain's first
 * networkAddress, then to the deployment-type address for unregistered chains.
 *
 * This matters when a chain lists multiple addresses for the same contract (e.g.
 * Lens and zkSync Era list both the canonical and zksync MultiSendCallOnly) — the
 * caller's `deploymentType` disambiguates which one the caller's Safe master copy
 * aligns with. A canonical (EVM bytecode) Safe cannot delegatecall into an EraVM
 * aux contract and vice versa.
 */
export const getChainAgnosticAddress = (
  deployment: SingletonDeploymentV2 | undefined,
  chainId: string,
  deploymentType: DeploymentType = 'canonical',
): string | undefined => {
  if (!deployment) return undefined

  const deploymentTypeAddress = deployment.deployments?.[deploymentType]?.address
  const networkAddresses = toNetworkAddressList(deployment.networkAddresses?.[chainId] ?? [])

  // 1. Prefer the requested deployment-type address if it's registered for this chain.
  if (
    deploymentTypeAddress &&
    networkAddresses.some((networkAddress) => sameAddress(networkAddress, deploymentTypeAddress))
  ) {
    return deploymentTypeAddress
  }

  // 2. Prefer the chain-agnostic deployment-type address. Covers unregistered chains
  //    and, crucially, chains whose networkAddresses list the OTHER flavour only —
  //    falling back to networkAddresses[0] there would return the wrong flavour and
  //    cause EVM↔EraVM delegatecall mismatches (see Lens / zkSync canonical handling).
  if (deploymentTypeAddress) {
    if (networkAddresses.length > 0) {
      console.warn(
        `[getChainAgnosticAddress] chain ${chainId} does not register the ${deploymentType} address; ` +
          `falling back to the chain-agnostic deployment address`,
      )
    }
    return deploymentTypeAddress
  }

  // 3. Last resort: chain has entries but no deployment-type address at all.
  return networkAddresses[0]
}

/**
 * Safe versions whose canonical companion deployments (CompatibilityFallbackHandler,
 * MultiSend, SignMessageLib, …) the app trusts. Only 1.3.0+ is listed — earlier
 * versions shipped different or no canonical companion contracts. Extend this when
 * a new Safe version's contracts are rolled out.
 */
export const TRUSTED_DEPLOYMENT_VERSIONS: SafeVersion[] = ['1.3.0', '1.4.1', '1.5.0']

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

export type OfficialFallbackHandlerType = 'compatibility' | 'extensible'

/**
 * Identifies which official Safe fallback handler deployment an address matches on the
 * given chain, across the trusted deployment versions. The single source of truth for
 * "is this fallback handler official" — 1.5.0 ships TWO official handlers, so checking
 * only the CompatibilityFallbackHandler tables misses the ExtensibleFallbackHandler.
 *
 * Note: CoW's TWAP handler is CoW's own ExtensibleFallbackHandler instance and is NOT
 * covered here — callers that trust it must check it separately.
 *
 * @param contractAddress fallback handler address to identify
 * @param network chainId that is getting checked
 * @returns the matching handler type, or undefined if the address matches no official deployment
 */
export const identifyOfficialFallbackHandler = (
  contractAddress: string,
  network: string,
): OfficialFallbackHandlerType | undefined => {
  if (
    hasMatchingDeployment(
      getCompatibilityFallbackHandlerDeployments,
      contractAddress,
      network,
      TRUSTED_DEPLOYMENT_VERSIONS,
    )
  ) {
    return 'compatibility'
  }
  if (
    hasMatchingDeployment(
      getExtensibleFallbackHandlerDeployments,
      contractAddress,
      network,
      TRUSTED_DEPLOYMENT_VERSIONS,
    )
  ) {
    return 'extensible'
  }
  return undefined
}

/** SafeToL2Setup releases, newest first. There is no 1.3.0 release — the contract was introduced with 1.4.1. */
export const SAFE_TO_L2_SETUP_VERSIONS = ['1.5.0', '1.4.1'] as const
export type SafeToL2SetupVersion = (typeof SAFE_TO_L2_SETUP_VERSIONS)[number]

/**
 * Returns the SafeToL2Setup version that pairs with the given Safe version when
 * building a (multichain) creation — 1.5.0 Safes use the 1.5.0 setup contract,
 * everything from 1.4.1 up uses the 1.4.1 one.
 *
 * Only meaningful for `safeVersion >= 1.4.1` — the setup contract does not exist
 * for earlier versions; callers gate on that before including a setup call.
 */
export const getSafeToL2SetupVersion = (safeVersion: string): SafeToL2SetupVersion =>
  semverSatisfies(safeVersion, '>=1.5.0') ? '1.5.0' : '1.4.1'

/**
 * Identifies which SafeToL2Setup release a `setup()` `to` address belongs to, or
 * undefined for addresses that are no known SafeToL2Setup deployment. Use this to
 * recognise multichain creations regardless of the Safe version they were built at.
 */
export const getSafeToL2SetupVersionByAddress = (address: string | undefined): SafeToL2SetupVersion | undefined => {
  if (!address) return undefined
  return SAFE_TO_L2_SETUP_VERSIONS.find((version) =>
    sameAddress(getSafeToL2SetupDeployment({ version })?.defaultAddress, address),
  )
}

/**
 * Checks whether an implementation address is an official Safe singleton for the
 * given version. Matches against BOTH the L1 and L2 singleton tables and ALL
 * deployment variants (canonical, eip155, zksync). Official singletons live at
 * deterministic addresses, so this is chain-agnostic and needs no RPC.
 */
export const isOfficialMasterCopy = (implementation: string | undefined, version: string): boolean => {
  if (!implementation) {
    return false
  }

  const [clean] = version.split('+')
  const singletonTables = [
    getSafeSingletonDeployments({ version: clean }),
    getSafeL2SingletonDeployments({ version: clean }),
  ]

  return singletonTables.some((deployment) => {
    if (!deployment) {
      return false
    }
    return Object.values(deployment.deployments).some((variant) => sameAddress(variant?.address, implementation))
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
 * A chain is EraVM-backed if safe-deployments registers the `zksync` deployment
 * address for that chain in networkAddresses[chainId] for the given singleton
 * version. This generalizes the prior hard-coded zkSync Era mainnet check so that
 * any zk-stack chain (Lens, zkSync Sepolia, etc.) is handled uniformly.
 */
export const isEraVmChain = (chainId: string, version: SafeState['version']): boolean => {
  // Safe versions in this codebase can include metadata like `1.3.0+L2`; strip before
  // calling safe-deployments getters which match the bare version only.
  const [safeVersion] = (version ?? '1.3.0').split('+')
  const l2 = getSafeL2SingletonDeployments({ version: safeVersion })
  const l1 = getSafeSingletonDeployments({ version: safeVersion })

  return [l2, l1].some((deployment) => {
    if (!deployment) return false
    const zksyncAddress = deployment.deployments?.zksync?.address
    if (!zksyncAddress) return false
    const networkAddresses = toNetworkAddressList(deployment.networkAddresses?.[chainId] ?? [])
    return networkAddresses.some((networkAddress) => sameAddress(networkAddress, zksyncAddress))
  })
}

/**
 * Checks if an implementation address is a canonical (EVM bytecode) Safe deployment
 * on an EraVM-backed chain. EVM contracts cannot delegatecall into EraVM contracts,
 * so Safes whose master copy is canonical need canonical aux contracts too —
 * regardless of whether CGW flags the chain with `zk: true`.
 */
export const isCanonicalDeployment = (
  implementationAddress: string,
  chainId: string,
  version: SafeState['version'],
): boolean => {
  if (!implementationAddress) return false
  if (!isEraVmChain(chainId, version)) return false

  const [safeVersion] = (version ?? '1.3.0').split('+')

  const deployments: (SingletonDeploymentV2 | undefined)[] = [
    getSafeL2SingletonDeployments({ version: safeVersion }),
    getSafeSingletonDeployments({ version: safeVersion }),
  ]

  return deployments.some((deployment) => {
    const canonicalAddress = deployment?.deployments?.canonical?.address
    return canonicalAddress ? sameAddress(implementationAddress, canonicalAddress) : false
  })
}

/**
 * Gets the canonical MultiSendCallOnly address for a given version.
 * Used when a Safe on zkSync uses a canonical (EVM bytecode) mastercopy.
 */
export const getCanonicalMultiSendCallOnlyAddress = (version: SafeState['version']): string | undefined => {
  const [safeVersion] = (version ?? '1.3.0').split('+')
  const deployment = getMultiSendCallOnlyDeployments({ version: safeVersion })
  return deployment?.deployments.canonical?.address
}

/**
 * Gets the canonical MultiSend address for a given version.
 * Used when a Safe on zkSync uses a canonical (EVM bytecode) mastercopy.
 */
export const getCanonicalMultiSendAddress = (version: SafeState['version']): string | undefined => {
  const [safeVersion] = (version ?? '1.3.0').split('+')
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
export type MasterCopyFlavour = {
  deploymentType: DeploymentType
  isL1: boolean
}

/**
 * Detects the deployment type AND L1/L2 flavour of a Safe master copy by matching
 * its address against the canonical / zksync / eip155 singleton deployments for
 * the given version across BOTH L1 and L2 singleton tables.
 *
 * Returning `isL1` matters because a Safe on an L2 chain can still run an L1
 * singleton master copy (e.g. zkSync Era Safes using the L1 canonical 1.4.1
 * master copy). In that case the caller must resolve aux contracts against the
 * L1 singleton table, not the L2 one, to avoid mixing incompatible singletons.
 *
 * Falls back to `defaults` when the implementation cannot be matched — callers
 * should pass chain-level guesses (e.g. `!chain.l2`, `chain.zk`) as defaults.
 *
 * CAVEAT — custom / unrecognised master copies: when the implementation doesn't
 * match any entry in safe-deployments the defaults are used, which re-introduces
 * the chain-flag assumption this function is meant to avoid. A Safe on a zk-stack
 * chain that isn't flagged `zk: true` on CGW (e.g. Lens) running a custom
 * EraVM-bytecode master copy would incorrectly be treated as canonical. A proper
 * fix would require bytecode inspection (already done in the `!isValidMasterCopy`
 * branch of initSafeSDK) but that adds an RPC round-trip to the happy path.
 */
export const getDeploymentTypeForMasterCopy = (
  implementation: string | undefined,
  version: string,
  defaults: MasterCopyFlavour = { deploymentType: 'canonical', isL1: false },
): MasterCopyFlavour => {
  if (!implementation) return defaults
  const [cleanVersion] = version.split('+')

  const tables: Array<{ getter: DeploymentGetter; isL1: boolean }> = [
    { getter: getSafeL2SingletonDeployments, isL1: false },
    { getter: getSafeSingletonDeployments, isL1: true },
  ]

  for (const { getter, isL1 } of tables) {
    const deployment = getter({ version: cleanVersion })
    if (!deployment?.deployments) continue
    const { canonical, zksync, eip155 } = deployment.deployments
    if (zksync?.address && sameAddress(implementation, zksync.address)) {
      return { deploymentType: 'zksync', isL1 }
    }
    if (eip155?.address && sameAddress(implementation, eip155.address)) {
      return { deploymentType: 'eip155', isL1 }
    }
    if (canonical?.address && sameAddress(implementation, canonical.address)) {
      return { deploymentType: 'canonical', isL1 }
    }
  }

  return defaults
}

export const resolveChainAgnosticContractAddresses = (
  chainId: string,
  version: string,
  isL2: boolean,
  deploymentType: DeploymentType,
): ContractNetworkConfig | undefined => {
  const [cleanVersion] = version.split('+')

  const singletonGetter: DeploymentGetter = isL2 ? getSafeL2SingletonDeployments : getSafeSingletonDeployments

  // Prefer the address registered for this chainId in safe-deployments; only fall back
  // to the deployment-type address when the chain isn't registered. This ensures chains
  // like Lens (zk-stack but not flagged `zk: true` in CGW) still resolve to their
  // correct zksync aux-contract addresses via networkAddresses[chainId].
  const singletonAddress = getChainAgnosticAddress(singletonGetter({ version: cleanVersion }), chainId, deploymentType)
  if (!singletonAddress) {
    console.warn(`[resolveChainAgnostic] No singleton address for v${cleanVersion} (${deploymentType}, L2=${isL2})`)
    return undefined
  }

  const resolved: Record<string, string> = { safeSingletonAddress: singletonAddress }
  const missingContracts: string[] = []

  // Resolve auxiliary contracts — missing ones are non-fatal
  for (const [field, getter] of Object.entries(BASE_DEPLOYMENT_GETTERS)) {
    const address = getChainAgnosticAddress(getter({ version: cleanVersion }), chainId, deploymentType)
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
