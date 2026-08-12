import {
  getSafeToL2SetupVersionByAddress,
  hasCanonicalDeployment,
  hasMatchingDeployment,
  identifyOfficialFallbackHandler,
  TRUSTED_DEPLOYMENT_VERSIONS,
} from '@safe-global/utils/services/contracts/deployments'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import {
  getProxyFactoryDeployments,
  getSafeL2SingletonDeployments,
  getSafeSingletonDeployments,
  getSafeToL2MigrationDeployments,
  getSafeToL2SetupDeployments,
} from '@safe-global/safe-deployments'
import { type Chain as ChainInfo } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'

/**
 * Returns all chains where the creations's masterCopy and factory are deployed.
 * @param creation
 * @param chains
 */
export const useCompatibleNetworks = (
  creation: ReplayedSafeProps | undefined,
  chains: ChainInfo[],
): (ChainInfo & { available: boolean })[] => {
  if (!creation) {
    return []
  }

  const { masterCopy, factoryAddress, safeAccountConfig } = creation

  const { fallbackHandler, to } = safeAccountConfig

  return chains.map((config) => {
    const isL1MasterCopy = hasMatchingDeployment(
      getSafeSingletonDeployments,
      masterCopy,
      config.chainId,
      TRUSTED_DEPLOYMENT_VERSIONS,
    )
    const isL2MasterCopy = hasMatchingDeployment(
      getSafeL2SingletonDeployments,
      masterCopy,
      config.chainId,
      TRUSTED_DEPLOYMENT_VERSIONS,
    )
    const masterCopyExists = isL1MasterCopy || isL2MasterCopy

    const proxyFactoryExists = hasMatchingDeployment(
      getProxyFactoryDeployments,
      factoryAddress,
      config.chainId,
      TRUSTED_DEPLOYMENT_VERSIONS,
    )
    // Any official Compatibility- or ExtensibleFallbackHandler deployment across the trusted versions counts
    const fallbackHandlerExists = Boolean(identifyOfficialFallbackHandler(fallbackHandler, config.chainId))

    // We only need to check that it is nonzero as useSafeCreationData already validates that it is the setupToL2 call otherwise
    const includesSetupToL2 = to !== ZERO_ADDRESS

    // If the creation includes the setupToL2 call, the same release of the contract needs to be deployed on the chain
    const setupToL2Version = getSafeToL2SetupVersionByAddress(to)
    const areSetupToL2ConditionsMet =
      !includesSetupToL2 ||
      (!!setupToL2Version &&
        hasCanonicalDeployment(
          getSafeToL2SetupDeployments({ network: config.chainId, version: setupToL2Version }),
          config.chainId,
        ))

    // If the masterCopy is L1 on a L2 chain, includes the setupToL2 Call or the Migration contract exists
    const isMigrationRequired = isL1MasterCopy && !includesSetupToL2 && config.l2
    const isMigrationPossible = hasCanonicalDeployment(
      getSafeToL2MigrationDeployments({ network: config.chainId, version: '1.4.1' }),
      config.chainId,
    )
    const areMigrationConditionsMet = !isMigrationRequired || isMigrationPossible

    return {
      ...config,
      available:
        masterCopyExists &&
        proxyFactoryExists &&
        fallbackHandlerExists &&
        areSetupToL2ConditionsMet &&
        areMigrationConditionsMet,
    }
  })
}
