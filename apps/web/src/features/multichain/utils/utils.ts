import type { DecodedDataResponse, ChainInfo, SafeOverview } from '@safe-global/safe-gateway-typescript-sdk'
import semverSatisfies from 'semver/functions/satisfies'
import memoize from 'lodash/memoize'
import { keccak256, ethers, solidityPacked, getCreate2Address, type Provider } from 'ethers'

import { type UndeployedSafesState, type ReplayedSafeProps } from '@/store/slices'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { Safe_proxy_factory__factory } from '@safe-global/utils/types/contracts'
import { extractCounterfactualSafeSetup } from '@/features/counterfactual/utils'
import { encodeSafeSetupCall } from '@/components/new-safe/create/logic'
import { FEATURES, hasFeature } from '@/utils/chains'
import { type SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { type MultiChainSafeItem } from '@/features/myAccounts/hooks/useAllSafesGrouped'
import { LATEST_SAFE_VERSION } from '@safe-global/utils/config/constants'

type SafeSetup = {
  owners: string[]
  threshold: number
  chainId: string
}

export const isChangingSignerSetup = (decodedData: DecodedDataResponse | undefined) => {
  return decodedData?.method === 'addOwnerWithThreshold' || decodedData?.method === 'removeOwner'
}

export const isMultiChainSafeItem = (safe: SafeItem | MultiChainSafeItem): safe is MultiChainSafeItem => {
  if ('safes' in safe && 'address' in safe) {
    return true
  }
  return false
}

export const isSafeItem = (safe: SafeItem | MultiChainSafeItem): safe is SafeItem => {
  return !isMultiChainSafeItem(safe)
}

const areOwnersMatching = (owners1: string[], owners2: string[]) =>
  owners1.length === owners2.length && owners1.every((owner) => owners2.some((owner2) => sameAddress(owner, owner2)))

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

const canMultichain = (chain: ChainInfo) => {
  const MIN_SAFE_VERSION = '1.4.1'
  return hasFeature(chain, FEATURES.COUNTERFACTUAL) && semverSatisfies(LATEST_SAFE_VERSION, `>=${MIN_SAFE_VERSION}`)
}

export const hasMultiChainCreationFeatures = (chain: ChainInfo): boolean => {
  return hasFeature(chain, FEATURES.MULTI_CHAIN_SAFE_CREATION) && canMultichain(chain)
}

export const hasMultiChainAddNetworkFeature = (chain: ChainInfo | undefined): boolean => {
  if (!chain) return false
  return hasFeature(chain, FEATURES.MULTI_CHAIN_SAFE_ADD_NETWORK) && canMultichain(chain)
}
