import { getAddress } from 'ethers'
import { getMultiSendCallOnlyDeployments } from '@safe-global/safe-deployments'
import { OperationType } from '@safe-global/types-kit'
import { getDeploymentAddresses, TRUSTED_DEPLOYMENT_VERSIONS } from '@safe-global/utils/services/contracts/deployments'
import { Multi_send_call_only__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.3.0'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { PolicyConfiguration } from '../public/types'
import { FALLBACK_SELECTOR, isFallbackAccess } from '../public/services/fallbackAccess'
import { requirePolicy } from '../public/services/allowlistConfigurations'
import { REJECT_SELECTOR } from '../public/services/rejectAccess'

export const MULTI_SEND_SELECTOR = Multi_send_call_only__factory.createInterface().getFunction('multiSend').selector
const MULTI_SEND_POLICY_DATA = '0x'

type Access = Pick<PolicyConfiguration, 'target' | 'selector' | 'operation'>

const isSameAccess = (a: Access, b: Access): boolean =>
  sameAddress(a.target, b.target) &&
  a.selector.toLowerCase() === b.selector.toLowerCase() &&
  a.operation === b.operation

/** Every official MultiSendCallOnly of the trusted Safe versions on the chain, canonical and eip155 alike. */
export const getOfficialMultiSendCallOnlyAddresses = (chainId: string): string[] => [
  ...new Set(
    getDeploymentAddresses(getMultiSendCallOnlyDeployments, chainId, TRUSTED_DEPLOYMENT_VERSIONS).map((address) =>
      getAddress(address),
    ),
  ),
]

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

const withRejectAccess = (
  chainId: string,
  safeAddress: string,
  configurations: PolicyConfiguration[],
): PolicyConfiguration[] => {
  const access: PolicyConfiguration = {
    target: safeAddress,
    selector: REJECT_SELECTOR,
    operation: OperationType.Call,
    policy: requirePolicy(chainId, 'AllowPolicy'),
    data: '0x',
  }

  return [...configurations.filter((configuration) => !isSameAccess(configuration, access)), access]
}

const withFallback = (chainId: string, configurations: PolicyConfiguration[]): PolicyConfiguration[] => {
  const policy = requirePolicy(chainId, 'DenyPolicy')

  return [
    ...configurations.filter((configuration) => !isFallbackAccess(configuration)),
    ...[OperationType.Call, OperationType.DelegateCall].map((operation) => ({
      target: ZERO_ADDRESS,
      selector: FALLBACK_SELECTOR,
      operation,
      policy,
      data: '0x',
    })),
  ]
}

/** What a first setup adds to the caller's entries: the MultiSend bindings, the reject access, then the deny fallback. */
export const withFirstSetupDefaults = (
  chainId: string,
  safeAddress: string,
  configurations: PolicyConfiguration[],
): PolicyConfiguration[] =>
  withFallback(chainId, withRejectAccess(chainId, safeAddress, withMultiSendBindings(chainId, configurations)))
