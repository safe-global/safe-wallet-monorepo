import type { Address } from 'viem'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { getOfficialMultiSendCallOnlyAddresses } from '../MultiSendPolicy/multiSendAddress'
import { getPolicyDeployments } from './policyDeployments'

/** The MultiSendPolicy a first guard setup binds every official MultiSendCallOnly to. */
export type MultiSendDefaults = { policy: Address; targets: Address[] }

/** Undefined on a chain without MultiSendPolicy or any official MultiSendCallOnly. */
export const getDefaultMultiSend = (chainId: string): MultiSendDefaults | undefined => {
  const policy = getPolicyDeployments(chainId)?.policies[PolicyType.MultiSend]
  const targets = getOfficialMultiSendCallOnlyAddresses(chainId) as Address[]
  return policy && targets.length > 0 ? { policy, targets } : undefined
}
