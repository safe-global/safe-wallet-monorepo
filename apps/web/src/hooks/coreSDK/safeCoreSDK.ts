import chains from '@safe-global/utils/config/chains'
import { getSafeL2SingletonDeployments, getSafeSingletonDeployments } from '@safe-global/safe-deployments'
import ExternalStore from '@safe-global/utils/services/ExternalStore'
import { Gnosis_safe__factory } from '@safe-global/utils/types/contracts'
import Safe, { type ContractNetworksConfig } from '@safe-global/protocol-kit'
import { isValidMasterCopy } from '@safe-global/utils/services/contracts/safeContracts'
import { isPredictedSafeProps, isReplayedSafeProps } from '@/features/counterfactual/utils'
import { isLegacyVersion } from '@safe-global/utils/services/contracts/utils'
import { isInDeployments } from '@safe-global/utils/hooks/coreSDK/utils'
import type { SafeCoreSDKProps } from '@safe-global/utils/hooks/coreSDK/types'
import { keccak256 } from 'ethers'
import {
  getL2MasterCopyVersionByCodeHash,
  isL2MasterCopyCodeHash,
} from '@safe-global/utils/services/contracts/deployments'

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
  if (providerNetwork !== BigInt(chainId)) {
    return
  }

  let safeVersion = version ?? (await Gnosis_safe__factory.connect(address, provider).VERSION())
  let isL1SafeSingleton = chainId === chains.eth
  let contractNetworks: ContractNetworksConfig | undefined

  // If it is an official deployment we should still initiate the safeSDK
  if (!isValidMasterCopy(implementationVersionState)) {
    const masterCopy = implementation

    const safeL1Deployment = getSafeSingletonDeployments({ network: chainId, version: safeVersion })
    const safeL2Deployment = getSafeL2SingletonDeployments({ network: chainId, version: safeVersion })

    isL1SafeSingleton = isInDeployments(masterCopy, safeL1Deployment?.networkAddresses[chainId])
    const isL2SafeMasterCopy = isInDeployments(masterCopy, safeL2Deployment?.networkAddresses[chainId])

    if (!isL1SafeSingleton && !isL2SafeMasterCopy) {
      try {
        const code = await provider.getCode(masterCopy)

        if (!code || code === '0x') {
          return Promise.resolve(undefined)
        }

        const codeHash = keccak256(code)
        const isUpgradeableL2MasterCopy = isL2MasterCopyCodeHash(codeHash)

        if (!isUpgradeableL2MasterCopy) {
          return Promise.resolve(undefined)
        }

        const upgradeableVersion = getL2MasterCopyVersionByCodeHash(codeHash)

        if (!upgradeableVersion) {
          return Promise.resolve(undefined)
        }

        // Use the custom mastercopy address with the SDK
        contractNetworks = {
          [chainId]: {
            safeSingletonAddress: masterCopy,
          },
        }

        safeVersion = upgradeableVersion
        isL1SafeSingleton = false
      } catch (error) {
        return Promise.resolve(undefined)
      }
    }

    if (isL2SafeMasterCopy) {
      isL1SafeSingleton = false
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
        ...(contractNetworks ? { contractNetworks } : {}),
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
    ...(contractNetworks ? { contractNetworks } : {}),
  })
}

export const {
  getStore: getSafeSDK,
  setStore: setSafeSDK,
  useStore: useSafeSDK,
} = new ExternalStore<Safe | undefined>()
