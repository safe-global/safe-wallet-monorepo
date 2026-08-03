import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import semverSatisfies from 'semver/functions/satisfies'
import memoize from 'lodash/memoize'
import { keccak256, ethers, solidityPacked, getCreate2Address, getAddress, zeroPadValue, type Provider } from 'ethers'
import { getProxyFactoryDeployments } from '@safe-global/safe-deployments'
import type { SafeSetup } from '../types'

import {
  type UndeployedSafesState,
  type ReplayedSafeProps,
} from '@safe-global/utils/features/counterfactual/store/types'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { areOwnersMatching } from '@safe-global/utils/utils/safe-setup-comparison'
import { Safe_proxy_factory__factory } from '@safe-global/utils/types/contracts'
import { extractCounterfactualSafeSetup } from '@/features/counterfactual/services'
import { encodeSafeSetupCall } from '@/components/new-safe/create/logic'
import { type SafeItem } from '@/hooks/safes'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { MIN_SAFE_VERSION_FOR_MULTICHAIN } from '../constants'

// Re-export from shared hooks for backward compatibility. Import the guard from its leaf module
// (not the `@/hooks/safes` barrel) so this feature file doesn't re-enter the barrel during module
// init — that cycle crashed Storybook's webpack module evaluation.
export { isMultiChainSafeItem } from '@/hooks/safes/isMultiChainSafeItem'

export const getSafeSetups = (
  safes: SafeItem[],
  safeOverviews: SafeOverview[],
  undeployedSafes: UndeployedSafesState,
): (SafeSetup | undefined)[] => {
  const safeSetups = safes.map((safeItem) => {
    const undeployedSafe = undeployedSafes?.[safeItem.chainId]?.[safeItem.address]
    if (undeployedSafe) {
      const counterfactualSetup = extractCounterfactualSafeSetup(undeployedSafe, safeItem.chainId)
      if (!counterfactualSetup) return undefined
      return {
        owners: counterfactualSetup.owners,
        threshold: counterfactualSetup.threshold,
        chainId: safeItem.chainId,
      }
    }
    const foundOverview = safeOverviews?.find(
      (overview) => overview.chainId === safeItem.chainId && sameAddress(overview.address.value, safeItem.address),
    )
    if (!foundOverview) return undefined
    return {
      owners: foundOverview.owners.map((owner) => owner.value),
      threshold: foundOverview.threshold,
      chainId: safeItem.chainId,
    }
  })
  return safeSetups
}

export const getSharedSetup = (safeSetups: (SafeSetup | undefined)[]): Omit<SafeSetup, 'chainId'> | undefined => {
  const comparisonSetup = safeSetups[0]

  if (!comparisonSetup) return undefined

  const allMatching = safeSetups.every(
    (setup) =>
      setup && areOwnersMatching(setup.owners, comparisonSetup.owners) && setup.threshold === comparisonSetup.threshold,
  )

  const { owners, threshold } = comparisonSetup
  return allMatching ? { owners, threshold } : undefined
}

export const getDeviatingSetups = (
  safeSetups: (SafeSetup | undefined)[],
  currentChainId: string | undefined,
): SafeSetup[] => {
  const currentSafeSetup = safeSetups.find((setup) => setup?.chainId === currentChainId)
  if (!currentChainId || !currentSafeSetup) return []

  const deviatingSetups = safeSetups
    .filter((setup): setup is SafeSetup => Boolean(setup))
    .filter((setup) => {
      return (
        setup &&
        (!areOwnersMatching(setup.owners, currentSafeSetup.owners) || setup.threshold !== currentSafeSetup.threshold)
      )
    })
  return deviatingSetups
}

const memoizedGetProxyCreationCode = memoize(
  async (factoryAddress: string, provider: Provider) => {
    return Safe_proxy_factory__factory.connect(factoryAddress, provider).proxyCreationCode()
  },
  async (factoryAddress, provider) => `${factoryAddress}${(await provider.getNetwork()).chainId}`,
)

// zkSync EraVM derives CREATE2 addresses with its own formula:
// keccak256(keccak256('zksyncCreate2') ++ factory ++ salt ++ proxyBytecodeHash ++ keccak256(input))
// where proxyBytecodeHash is the EraVM bytecode-hash format, NOT keccak256 of EVM init code.
// see https://docs.zksync.io/build/developer-reference/ethereum-differences/evm-instructions#address-derivation
const ZKSYNC_CREATE2_PREFIX = keccak256(ethers.toUtf8Bytes('zksyncCreate2'))

// EraVM (zksolc) SafeProxy bytecode hashes per Safe version, matching protocol-kit's
// internal ZKSYNC_SAFE_PROXY_DEPLOYED_BYTECODE table (not publicly exported there). They
// cannot be computed here: no package in the tree ships the raw EraVM proxy bytecode.
// This is a closed set — EraVM deployments end at 1.4.1; from 1.5.0 zk chains ship EVM
// (canonical) contracts only, so no new entries can ever be needed.
const ZKSYNC_PROXY_BYTECODE_HASH: Record<string, string> = {
  '1.3.0': '0x0100004124426fb9ebb25e27d670c068e52f9ba631bd383279a188be47e3f86d',
  '1.4.1': '0x0100003b6cfa15bd7d1cae1c9c022074524d7785d34859ad0576d8fab4305d4f',
}

/**
 * Returns the EraVM proxy bytecode hash when the factory is a zksync-flavour (EraVM)
 * proxy-factory deployment, undefined for EVM (canonical / eip155) factories. The
 * factory's flavour — not the chain — decides the address-derivation formula: chains
 * like zkSync Era host both an EraVM and an EVM factory side by side.
 */
const getZkSyncProxyBytecodeHash = (factoryAddress: string): string | undefined => {
  const version = Object.keys(ZKSYNC_PROXY_BYTECODE_HASH).find((version) =>
    sameAddress(getProxyFactoryDeployments({ version })?.deployments.zksync?.address, factoryAddress),
  )
  return version ? ZKSYNC_PROXY_BYTECODE_HASH[version] : undefined
}

export const predictSafeAddress = async (
  setupData: { initializer: string; saltNonce: string; singleton: string },
  factoryAddress: string,
  provider: Provider,
) => {
  // Step 1: Hash the initializer
  const initializerHash = keccak256(setupData.initializer)

  // Step 2: Encode the initializerHash and saltNonce using abi.encodePacked equivalent
  const encoded = ethers.concat([initializerHash, solidityPacked(['uint256'], [setupData.saltNonce])])

  // Step 3: Hash the encoded value to get the final salt
  const salt = keccak256(encoded)

  // An EraVM factory derives the proxy address with zkSync's native CREATE2 formula —
  // applying the EVM formula here predicts an address the factory will never deploy to.
  const zkProxyBytecodeHash = getZkSyncProxyBytecodeHash(factoryAddress)
  if (zkProxyBytecodeHash) {
    const input = solidityPacked(['uint256'], [setupData.singleton])
    const addressBytes = keccak256(
      ethers.concat([
        ZKSYNC_CREATE2_PREFIX,
        zeroPadValue(factoryAddress, 32),
        salt,
        zkProxyBytecodeHash,
        keccak256(input),
      ]),
    ).slice(26)
    return getAddress(`0x${addressBytes}`)
  }

  // Get Proxy creation code
  const proxyCreationCode = await memoizedGetProxyCreationCode(factoryAddress, provider)

  const initCode = proxyCreationCode + solidityPacked(['uint256'], [setupData.singleton]).slice(2)
  return getCreate2Address(factoryAddress, salt, keccak256(initCode))
}

export const predictAddressBasedOnReplayData = async (safeCreationData: ReplayedSafeProps, provider: Provider) => {
  const initializer = encodeSafeSetupCall(safeCreationData.safeAccountConfig)
  return predictSafeAddress(
    { initializer, saltNonce: safeCreationData.saltNonce, singleton: safeCreationData.masterCopy },
    safeCreationData.factoryAddress,
    provider,
  )
}

const canMultichain = (chain: Chain) => {
  return (
    hasFeature(chain, FEATURES.COUNTERFACTUAL) &&
    semverSatisfies(LATEST_SAFE_VERSION, `>=${MIN_SAFE_VERSION_FOR_MULTICHAIN}`)
  )
}

export const hasMultiChainCreationFeatures = (chain: Chain): boolean => {
  return hasFeature(chain, FEATURES.MULTI_CHAIN_SAFE_CREATION) && canMultichain(chain)
}

export const hasMultiChainAddNetworkFeature = (chain: Chain | undefined): boolean => {
  if (!chain) return false
  return hasFeature(chain, FEATURES.MULTI_CHAIN_SAFE_ADD_NETWORK) && canMultichain(chain)
}
