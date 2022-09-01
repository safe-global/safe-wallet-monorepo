import { getAllowanceModuleDeployment } from '@gnosis.pm/safe-modules-deployments'

import { AllowanceModule, AllowanceModule__factory } from '@/types/contracts'
import { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers'

// TODO: Yet to be implemented in Core SDK
export const getSpendingLimitModuleAddress = (chainId: string): string | undefined => {
  const deployment = getAllowanceModuleDeployment({ network: chainId })

  return deployment?.networkAddresses[chainId]
}

export const getSpendingLimitContract = (
  chainId: string,
  provider: JsonRpcProvider | JsonRpcSigner,
): AllowanceModule => {
  const allowanceModuleDeployment = getAllowanceModuleDeployment({ network: chainId })

  if (!allowanceModuleDeployment) {
    throw new Error(`AllowanceModule contract not found`)
  }

  const contractAddress = allowanceModuleDeployment.networkAddresses[chainId]

  return AllowanceModule__factory.connect(contractAddress, provider)
}

export const getSpendingLimitInterface = () => {
  return AllowanceModule__factory.createInterface()
}
