import type { JsonRpcProvider } from 'ethers'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { UndeployedSafe } from '@safe-global/utils/features/counterfactual/store/types'
import type { ContractAddresses } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

export type SafeCoreSDKProps = {
  provider: JsonRpcProvider
  chainId: SafeState['chainId']
  address: SafeState['address']['value']
  version: SafeState['version']
  implementationVersionState: SafeState['implementationVersionState']
  implementation: SafeState['implementation']['value']
  undeployedSafe?: UndeployedSafe
  isL2Chain?: boolean
  isZkChain?: boolean
  contractAddresses?: ContractAddresses | null
}
