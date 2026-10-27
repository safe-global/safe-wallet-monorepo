import { FunctionFragment, getAddress } from 'ethers'
import { getMultiSendCallOnlyDeployments } from '@safe-global/safe-deployments'
import { OperationType } from '@safe-global/types-kit'
import { TRUSTED_DEPLOYMENT_VERSIONS } from '@safe-global/utils/services/contracts/deployments'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { POLICY_DEFAULT_FALLBACK } from '@/config/constants'
import type { PolicyConfiguration } from '../types'
import { FALLBACK_SELECTOR, isFallbackAccess } from './fallbackAccess'
import { requirePolicy } from './allowlistConfigurations'

export const MULTI_SEND_SELECTOR = FunctionFragment.from('function multiSend(bytes transactions)').selector
const MULTI_SEND_POLICY_DATA = '0x'

type Access = Pick<PolicyConfiguration, 'target' | 'selector' | 'operation'>

const isSameAccess = (a: Access, b: Access): boolean =>
  sameAddress(a.target, b.target) &&
  a.selector.toLowerCase() === b.selector.toLowerCase() &&
  a.operation === b.operation

/** Every official MultiSendCallOnly of the trusted Safe versions on the chain, canonical and eip155 alike. */
export const getOfficialMultiSendCallOnlyAddresses = (chainId: string): string[] => {
  const addresses = TRUSTED_DEPLOYMENT_VERSIONS.flatMap((version) => {
    const address = getMultiSendCallOnlyDeployments({ network: chainId, version })?.networkAddresses[chainId]
    return address === undefined ? [] : [address].flat()
  })
  return [...new Set(addresses.map((address) => getAddress(address)))]
}

const withMultiSendBindings = (chainId: string, configurations: PolicyConfiguration[]): PolicyConfiguration[] => {
  const policy = requirePolicy(chainId, 'MultiSendPolicy')
  const bindings = getOfficialMultiSendCallOnlyAddresses(chainId)
    .map((target) => ({
      target,
      selector: MULTI_SEND_SELECTOR,
      operation: OperationType.DelegateCall,
      policy,
      data: MULTI_SEND_POLICY_DATA,
    }))
    .filter((binding) => !configurations.some((configuration) => isSameAccess(configuration, binding)))

  return [...configurations, ...bindings]
}

// The guard refuses any call no access covers, so a first setup without a fallback would block everything else
const withFallback = (
  chainId: string,
  configurations: PolicyConfiguration[],
  fallback: 'allow' | 'deny',
): PolicyConfiguration[] => {
  if (configurations.some(isFallbackAccess)) return configurations
  const policy = requirePolicy(chainId, fallback === 'deny' ? 'DenyPolicy' : 'AllowPolicy')

  return [
    ...configurations,
    ...[OperationType.Call, OperationType.DelegateCall].map((operation) => ({
      target: ZERO_ADDRESS,
      selector: FALLBACK_SELECTOR,
      operation,
      policy,
      data: '0x',
    })),
  ]
}

/** What a first setup installs besides the caller's entries: MultiSendPolicy on every official batch target, then the fallback. */
export const withFirstSetupDefaults = (
  chainId: string,
  configurations: PolicyConfiguration[],
  fallback: 'allow' | 'deny' = POLICY_DEFAULT_FALLBACK,
): PolicyConfiguration[] => withFallback(chainId, withMultiSendBindings(chainId, configurations), fallback)
