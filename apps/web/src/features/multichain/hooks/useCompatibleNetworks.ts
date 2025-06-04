import useChains from '@/hooks/useChains'
import { hasCanonicalDeployment, hasMatchingDeployment } from '@safe-global/utils/services/contracts/deployments'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { type SafeVersion } from '@safe-global/types-kit'
import {
  getCompatibilityFallbackHandlerDeployments,
  getProxyFactoryDeployments,
  getSafeL2SingletonDeployments,
  getSafeSingletonDeployments,
  getSafeToL2MigrationDeployments,
  getSafeToL2SetupDeployments,
} from '@safe-global/safe-deployments'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'

const SUPPORTED_VERSIONS: SafeVersion[] = ['1.4.1', '1.3.0']

/**
 * Returns all chains where the creations's masterCopy and factory are deployed.
 * @param creation
 */
export const useCompatibleNetworks = (
  creation: ReplayedSafeProps | undefined,
): (ChainInfo & { available: boolean })[] => {
  const { configs } = useChains()

  if (!creation) {
    return []
  }

  const { masterCopy, factoryAddress, safeAccountConfig } = creation

  const { fallbackHandler, to } = safeAccountConfig

  return configs.map((config) => {
    const isL1MasterCopy = hasMatchingDeployment(
      getSafeSingletonDeployments,
      masterCopy,
      config.chainId,
      SUPPORTED_VERSIONS,
    )
    const isL2MasterCopy = hasMatchingDeployment(
      getSafeL2SingletonDeployments,
      masterCopy,
      config.chainId,
      SUPPORTED_VERSIONS,
    )
    const masterCopyExists = isL1MasterCopy || isL2MasterCopy

    const proxyFactoryExists = hasMatchingDeployment(
      getProxyFactoryDeployments,
      factoryAddress,
      config.chainId,
      SUPPORTED_VERSIONS,
    )
    const fallbackHandlerExists = hasMatchingDeployment(
      getCompatibilityFallbackHandlerDeployments,
      fallbackHandler,
      config.chainId,
      SUPPORTED_VERSIONS,
    )

    // We only need to check that it is nonzero as useSafeCreationData already validates that it is the setupToL2 call otherwise
    const includesSetupToL2 = to !== ZERO_ADDRESS

    // If the creation includes the setupToL2 call, the contract needs to be deployed on the chain
    const areSetupToL2ConditionsMet =
      !includesSetupToL2 ||
      hasCanonicalDeployment(getSafeToL2SetupDeployments({ network: config.chainId, version: '1.4.1' }), config.chainId)

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
