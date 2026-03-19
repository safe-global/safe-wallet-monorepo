import chains from '@safe-global/utils/config/chains'
import { getSafeSingletonDeployments, getSafeL2SingletonDeployments } from '@safe-global/safe-deployments'
import ExternalStore from '@safe-global/utils/services/ExternalStore'
import { Gnosis_safe__factory } from '@safe-global/utils/types/contracts'
import Safe, { type ContractNetworksConfig } from '@safe-global/protocol-kit'
import { isLegacyVersion } from '@safe-global/utils/services/contracts/utils'
import { isValidMasterCopy } from '@safe-global/utils/services/contracts/safeContracts'
import type { SafeCoreSDKProps } from '@safe-global/utils/hooks/coreSDK/types'
import { isInDeployments } from '@safe-global/utils/hooks/coreSDK/utils'
import {
  isChainAgnosticVersion,
  resolveChainAgnosticContractAddresses,
} from '@safe-global/utils/services/contracts/deployments'

const singletonSafeSDK = new Map<string, Safe>()

export const initSafeSDK = async ({
  provider,
  chainId,
  address,
  version,
  implementationVersionState,
  implementation,
  isL2Chain,
  isZkChain,
}: SafeCoreSDKProps): Promise<Safe | undefined> => {
  const providerUrl = provider._getConnection().url
  const key = `${chainId}-${address}-${version}-${implementationVersionState}-${implementation}-${providerUrl}`

  if (singletonSafeSDK.has(key)) {
    return singletonSafeSDK.get(key)
  }

  const providerNetwork = (await provider.getNetwork()).chainId
  if (providerNetwork !== BigInt(chainId)) {
    return
  }

  const safeVersion = version ?? (await Gnosis_safe__factory.connect(address, provider).VERSION())
  let isL1SafeSingleton = chainId === chains.eth
  let contractNetworks: ContractNetworksConfig | undefined

  // For versions >= 1.4.1, resolve all addresses chain-agnostically (works on any chain)
  if (isChainAgnosticVersion(safeVersion) && isL2Chain !== undefined) {
    const resolved = resolveChainAgnosticContractAddresses(safeVersion, isL2Chain, isZkChain ?? false)

    if (resolved) {
      contractNetworks = { [chainId]: resolved }
      isL1SafeSingleton = !isL2Chain
    }
  }

  // For older versions or unrecognized master copies, use per-chain lookup
  if (!isValidMasterCopy(implementationVersionState)) {
    const masterCopy = implementation

    const safeL1Deployment = getSafeSingletonDeployments({ network: chainId, version: safeVersion })
    const safeL2Deployment = getSafeL2SingletonDeployments({ network: chainId, version: safeVersion })

    const isL1Deployment = isInDeployments(masterCopy, safeL1Deployment?.networkAddresses[chainId])
    const isL2SafeMasterCopy = isInDeployments(masterCopy, safeL2Deployment?.networkAddresses[chainId])

    if (isL1Deployment) {
      isL1SafeSingleton = true
    } else if (isL2SafeMasterCopy) {
      isL1SafeSingleton = false
    } else if (!contractNetworks) {
      // Unknown deployment and no chain-agnostic resolution available
      return undefined
    }
  }

  if (isLegacyVersion(safeVersion)) {
    isL1SafeSingleton = true
  }

  const safeSDK = await Safe.init({
    provider: providerUrl,
    safeAddress: address,
    isL1SafeSingleton,
    ...(contractNetworks ? { contractNetworks } : {}),
  })
  singletonSafeSDK.set(key, safeSDK)

  return safeSDK
}

export const {
  getStore: getSafeSDK,
  setStore: setSafeSDK,
  useStore: useSafeSDK,
} = new ExternalStore<Safe | undefined>()

export const clearSingletonCache = (): void => {
  singletonSafeSDK.clear()
}
