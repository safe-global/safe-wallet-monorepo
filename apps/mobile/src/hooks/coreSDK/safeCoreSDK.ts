import chains from '@safe-global/utils/config/chains'
import { getSafeSingletonDeployments, getSafeL2SingletonDeployments } from '@safe-global/safe-deployments'
import ExternalStore from '@safe-global/utils/services/ExternalStore'
import { Gnosis_safe__factory } from '@safe-global/utils/types/contracts'
import Safe from '@safe-global/protocol-kit'
import { isLegacyVersion } from '@safe-global/utils/services/contracts/utils'
import { isValidMasterCopy } from '@safe-global/utils/services/contracts/safeContracts'
import type { SafeCoreSDKProps } from '@safe-global/utils/hooks/coreSDK/types'
import { isInDeployments } from '@safe-global/utils/hooks/coreSDK/utils'

// Safe Core SDK
export const initSafeSDK = async ({
  provider,
  chainId,
  address,
  version,
  implementationVersionState,
  implementation,
}: SafeCoreSDKProps): Promise<Safe | undefined> => {
  const providerNetwork = (await provider.getNetwork()).chainId
  if (providerNetwork !== BigInt(chainId)) {
    return
  }

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
