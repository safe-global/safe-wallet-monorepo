import { getAllowanceModuleDeployment } from '@safe-global/safe-modules-deployments'

import type { AllowanceModule } from '@safe-global/utils/types/contracts'
import { AllowanceModule__factory } from '@safe-global/utils/types/contracts'
import type { JsonRpcProvider, JsonRpcSigner } from 'ethers'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'

enum ALLOWANCE_MODULE_VERSIONS {
  '0.1.0' = '0.1.0',
  '0.1.1' = '0.1.1',
}

const ALL_VERSIONS = [ALLOWANCE_MODULE_VERSIONS['0.1.0'], ALLOWANCE_MODULE_VERSIONS['0.1.1']]

const getDeployment = (chainId: string, modules: SafeState['modules']) => {
  if (!modules?.length) return
  for (let version of ALL_VERSIONS) {
    const deployment = getAllowanceModuleDeployment({ network: chainId, version })
    if (!deployment) continue
    const deploymentAddress = deployment?.networkAddresses[chainId]
    const isMatch = modules?.some((address) => sameAddress(address.value, deploymentAddress))
    if (isMatch) return deployment
  }
}

export const getLatestSpendingLimitAddress = (chainId: string): string | undefined => {
  const deployment = getAllowanceModuleDeployment({ network: chainId })
  return deployment?.networkAddresses[chainId]
}

export const getDeployedSpendingLimitModuleAddress = (
  chainId: string,
  modules: SafeState['modules'],
): string | undefined => {
  const deployment = getDeployment(chainId, modules)
  return deployment?.networkAddresses[chainId]
}

// SDK request here: https://github.com/safe-global/safe-core-sdk/issues/263
export const getSpendingLimitContract = (
  chainId: string,
  modules: SafeState['modules'],
  provider: JsonRpcProvider | JsonRpcSigner,
): AllowanceModule => {
  const allowanceModuleDeployment = getDeployment(chainId, modules)

  if (!allowanceModuleDeployment) {
    throw new Error(`AllowanceModule contract not found`)
  }

  const contractAddress = allowanceModuleDeployment.networkAddresses[chainId]

  return AllowanceModule__factory.connect(contractAddress, provider)
}

export const getSpendingLimitInterface = () => {
  return AllowanceModule__factory.createInterface()
}
