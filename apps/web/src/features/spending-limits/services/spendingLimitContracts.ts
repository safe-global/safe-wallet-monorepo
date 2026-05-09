import type { AllowanceModule } from '@safe-global/utils/types/contracts'
import { AllowanceModule__factory } from '@safe-global/utils/types/contracts'
import type { JsonRpcProvider, JsonRpcSigner } from 'ethers'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import {
  getDeployment,
  getLatestSpendingLimitAddress,
  getDeployedSpendingLimitModuleAddress,
} from './spendingLimitDeployments'

// Re-export for convenience (used by other services in this feature)
export { getLatestSpendingLimitAddress, getDeployedSpendingLimitModuleAddress }

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
