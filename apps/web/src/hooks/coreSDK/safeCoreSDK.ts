import chains from '@/config/chains'
import type { UndeployedSafe } from '@/features/counterfactual/store/undeployedSafesSlice'
import { getSafeL2SingletonDeployments, getSafeSingletonDeployments } from '@safe-global/safe-deployments'
import ExternalStore from '@safe-global/utils/services/ExternalStore'
import { Gnosis_safe__factory } from '@safe-global/utils/types/contracts'
import type { JsonRpcProvider } from 'ethers'
import Safe from '@safe-global/protocol-kit'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { isValidMasterCopy } from '@safe-global/utils/services/contracts/safeContracts'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { isPredictedSafeProps, isReplayedSafeProps } from '@/features/counterfactual/utils'
import { isLegacyVersion } from '@safe-global/utils/services/contracts/utils'

type SafeCoreSDKProps = {
  provider: JsonRpcProvider
  chainId: SafeInfo['chainId']
  address: SafeInfo['address']['value']
  version: SafeInfo['version']
  implementationVersionState: SafeInfo['implementationVersionState']
  implementation: SafeInfo['implementation']['value']
  undeployedSafe?: UndeployedSafe
}

const isInDeployments = (address: string, deployments: string | string[] | undefined): boolean => {
  if (Array.isArray(deployments)) {
    return deployments.some((deployment) => sameAddress(deployment, address))
  }
  return sameAddress(address, deployments)
}

// Safe Core SDK
export const initSafeSDK = async ({
  provider,
  chainId,
  address,
  version,
  implementationVersionState,
  implementation,
  undeployedSafe,
}: SafeCoreSDKProps): Promise<Safe | undefined> => {
  const providerNetwork = (await provider.getNetwork()).chainId
  if (providerNetwork !== BigInt(chainId)) return

  const safeVersion = version ?? (await Gnosis_safe__factory.connect(address, provider).VERSION())
  let isL1SafeSingleton = chainId === chains.eth

  // If it is an official deployment we should still initiate the safeSDK
  if (!isValidMasterCopy(implementationVersionState)) {
    const masterCopy = implementation

    const safeL1Deployment = getSafeSingletonDeployments({ network: chainId, version: safeVersion })
    const safeL2Deployment = getSafeL2SingletonDeployments({ network: chainId, version: safeVersion })

    isL1SafeSingleton = isInDeployments(masterCopy, safeL1Deployment?.networkAddresses[chainId])
    const isL2SafeMasterCopy = isInDeployments(masterCopy, safeL2Deployment?.networkAddresses[chainId])

    // Unknown deployment, which we do not want to support
    if (!isL1SafeSingleton && !isL2SafeMasterCopy) {
      return Promise.resolve(undefined)
    }
  }
  // Legacy Safe contracts
  if (isLegacyVersion(safeVersion)) {
    isL1SafeSingleton = true
  }

  if (undeployedSafe) {
    if (isPredictedSafeProps(undeployedSafe.props) || isReplayedSafeProps(undeployedSafe.props)) {
      return Safe.init({
        provider: provider._getConnection().url,
        isL1SafeSingleton,
        predictedSafe: undeployedSafe.props,
      })
    }
    // We cannot initialize a Core SDK for replayed Safes yet.
    return
  }
  return Safe.init({
    provider: provider._getConnection().url,
    safeAddress: address,
    isL1SafeSingleton,
  })
}

export const {
  getStore: getSafeSDK,
  setStore: setSafeSDK,
  useStore: useSafeSDK,
} = new ExternalStore<Safe | undefined>()
