import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'

import type { AllowanceModule } from '@/types/contracts'
import { AllowanceModule__factory } from '@/types/contracts'
import type { JsonRpcProvider, JsonRpcSigner } from 'ethers'

export enum ALLOWANCE_MODULE_VERSIONS {
  '0.1.0' = '0.1.0',
  '0.1.1' = '0.1.1',
}

export const getSpendingLimitModuleAddress = (
  chainId: string,
  version?: ALLOWANCE_MODULE_VERSIONS,
): string | undefined => {
  const deployment = getAllowanceModuleDeployment({ network: chainId, version })

  return deployment?.networkAddresses[chainId]
}

// SDK request here: https://github.com/safe-global/safe-core-sdk/issues/263
export const getSpendingLimitContract = (
  chainId: string,
  provider: JsonRpcProvider | JsonRpcSigner,
  version = ALLOWANCE_MODULE_VERSIONS['0.1.1'],
): AllowanceModule => {
  const allowanceModuleDeployment = getAllowanceModuleDeployment({ network: chainId, version })

  if (!allowanceModuleDeployment) {
    throw new Error(`AllowanceModule contract not found`)
  }

  const contractAddress = allowanceModuleDeployment.networkAddresses[chainId]

  return AllowanceModule__factory.connect(contractAddress, provider)
}

export const getSpendingLimitInterface = () => {
  return AllowanceModule__factory.createInterface()
}
