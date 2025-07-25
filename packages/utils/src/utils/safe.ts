import type { SafeVersion } from '@safe-global/types-kit'
import {
  getSafeL2SingletonDeployments,
  getSafeSingletonDeployments,
  getSafeToL2SetupDeployment,
} from '@safe-global/safe-deployments'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import type { SafeAccountConfig } from '@safe-global/protocol-kit'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'

export const SAFE_CREATION_DATA_ERRORS = {
  TX_NOT_FOUND: 'The Safe creation transaction could not be found. Please retry later.',
  NO_CREATION_DATA: 'The Safe creation information for this Safe could not be found or is incomplete.',
  UNSUPPORTED_SAFE_CREATION: 'The method this Safe was created with is not supported.',
  NO_PROVIDER: 'The RPC provider for the origin network is not available.',
  LEGACY_COUNTERFATUAL: 'This undeployed Safe cannot be replayed. Please activate the Safe first.',
  PAYMENT_SAFE: 'The Safe creation used reimbursement. Adding networks to such Safes is not supported.',
  UNSUPPORTED_IMPLEMENTATION:
    'The Safe was created using an unsupported or outdated implementation. Adding networks to this Safe is not possible.',
  UNKNOWN_SETUP_MODULES: 'The Safe creation is using an unknown internal call',
}

export const determineMasterCopyVersion = (masterCopy: string, chainId: string): SafeVersion | undefined => {
  const SAFE_VERSIONS: SafeVersion[] = ['1.4.1', '1.3.0', '1.2.0', '1.1.1', '1.0.0']
  return SAFE_VERSIONS.find((version) => {
    const isL1Singleton = () => {
      const deployments = getSafeSingletonDeployments({ version })?.networkAddresses[chainId]

      if (Array.isArray(deployments)) {
        return deployments.some((deployment) => sameAddress(masterCopy, deployment))
      }
      return sameAddress(masterCopy, deployments)
    }

    const isL2Singleton = () => {
      const deployments = getSafeL2SingletonDeployments({ version })?.networkAddresses[chainId]

      if (Array.isArray(deployments)) {
        return deployments.some((deployment) => sameAddress(masterCopy, deployment))
      }
      return sameAddress(masterCopy, deployments)
    }

    return isL1Singleton() || isL2Singleton()
  })
}

export const decodeSetupData = (setupData: string): ReplayedSafeProps['safeAccountConfig'] => {
  const [owners, threshold, to, data, fallbackHandler, paymentToken, payment, paymentReceiver] =
    Safe__factory.createInterface().decodeFunctionData('setup', setupData)

  return {
    owners: [...owners],
    threshold: Number(threshold),
    to,
    data,
    fallbackHandler,
    paymentToken,
    payment: Number(payment),
    paymentReceiver,
  }
}

export const validateAccountConfig = (safeAccountConfig: SafeAccountConfig) => {
  // Safes that used the reimbursement logic are not supported
  if (
    (safeAccountConfig.payment && safeAccountConfig.payment > 0) ||
    (safeAccountConfig.paymentToken && safeAccountConfig.paymentToken !== ZERO_ADDRESS)
  ) {
    throw new Error(SAFE_CREATION_DATA_ERRORS.PAYMENT_SAFE)
  }

  const setupToL2Address = getSafeToL2SetupDeployment({ version: '1.4.1' })?.defaultAddress
  if (safeAccountConfig.to !== ZERO_ADDRESS && !sameAddress(safeAccountConfig.to, setupToL2Address)) {
    // Unknown setupModules calls cannot be replayed as the target contract is likely not deployed across chains
    throw new Error(SAFE_CREATION_DATA_ERRORS.UNKNOWN_SETUP_MODULES)
  }
}
