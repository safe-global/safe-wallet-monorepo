import type { JsonRpcProvider } from 'ethers'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { UndeployedSafe } from '@safe-global/utils/features/counterfactual/store/types'

export type SafeCoreSDKProps = {
  provider: JsonRpcProvider
  chainId: SafeState['chainId']
  address: SafeState['address']['value']
  version: SafeState['version']
  implementationVersionState: SafeState['implementationVersionState']
  implementation: SafeState['implementation']['value']
  undeployedSafe?: UndeployedSafe
}