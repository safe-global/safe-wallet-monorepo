import { AbiCoder } from 'ethers'
import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ERC20_INTERFACE } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { NATIVE_TRANSFER_SELECTOR } from '@safe-global/utils/features/policy-guard/constants'
import type { AllowlistRule } from '@/features/spaces'
import {
  ALLOWLIST_UNAVAILABLE_ERROR,
  EMPTY_ALLOWLIST_ERROR,
  TOO_MANY_CONFIGURATIONS_ERROR,
  ZERO_ADDRESS_RECIPIENT_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { PolicyConfiguration } from '../types'
import { SET_GUARD_SELECTOR, SET_MODULE_GUARD_SELECTOR } from './guardExit'
import { getPolicyEngineAddress, type PolicyEngineContract } from './policyEngineDeployments'

export const MAX_POLICY_CONFIGURATIONS = 100

const ERC20_TRANSFER_SELECTOR = ERC20_INTERFACE.getFunction('transfer').selector
const RECIPIENTS_TYPE = ['tuple(address recipient, uint8 permission)[]']
const PERMISSION_NONE = 0
const PERMISSION_ALWAYS = 2

export const encodeErc20TransferPolicyData = (recipients: string[], permission = PERMISSION_ALWAYS): string =>
  AbiCoder.defaultAbiCoder().encode(RECIPIENTS_TYPE, [recipients.map((recipient) => [recipient, permission])])

export const requirePolicy = (chainId: string, contract: PolicyEngineContract): string => {
  const policy = getPolicyEngineAddress(chainId, contract)
  if (!policy) throw new Error(ALLOWLIST_UNAVAILABLE_ERROR)
  return policy
}

export const decodeErc20TransferPolicyData = (data: string): string[] => {
  const [entries] = AbiCoder.defaultAbiCoder().decode(RECIPIENTS_TYPE, data)
  return entries.map(({ recipient }: { recipient: string }) => recipient)
}

const unbind = (target: string, selector: string): PolicyConfiguration => ({
  target,
  selector,
  operation: OperationType.Call,
  policy: ZERO_ADDRESS,
  data: '0x',
})

const guardExitConfigurations = (safeAddress: string, allowPolicy: string): PolicyConfiguration[] => [
  { target: safeAddress, selector: SET_GUARD_SELECTOR, operation: OperationType.Call, policy: allowPolicy, data: '0x' },
  {
    target: safeAddress,
    selector: SET_MODULE_GUARD_SELECTOR,
    operation: OperationType.Call,
    policy: allowPolicy,
    data: '0x',
  },
]

/** Unbinds what a removal leaves behind, so a new allowlist can't be taken off without waiting out the delay. */
export const clearGuardExitConfigurations = (safeAddress: string): PolicyConfiguration[] =>
  guardExitConfigurations(safeAddress, ZERO_ADDRESS)

/**
 * Deletes every rule of the allowlist and allows the Safe's two guard setters, which the first setup's MultiSend
 * bindings let through in one batch. ERC-20 recipients are revoked before their rule is unbound, since the policy
 * keeps them and a later rule on the token would let them through again.
 */
export const buildAllowlistRemovalConfigurations = ({
  chainId,
  safeAddress,
  rules,
}: {
  chainId: string
  safeAddress: string
  rules: AllowlistRule[]
}): PolicyConfiguration[] => {
  const removals = rules.flatMap(({ tokenAddress, recipients }): PolicyConfiguration[] =>
    sameAddress(tokenAddress, ZERO_ADDRESS)
      ? recipients.map((recipient) => unbind(recipient, NATIVE_TRANSFER_SELECTOR))
      : [
          {
            target: tokenAddress,
            selector: ERC20_TRANSFER_SELECTOR,
            operation: OperationType.Call,
            policy: requirePolicy(chainId, 'ERC20TransferPolicy'),
            data: encodeErc20TransferPolicyData(recipients, PERMISSION_NONE),
          },
          unbind(tokenAddress, ERC20_TRANSFER_SELECTOR),
        ],
  )
  const configurations = [...removals, ...guardExitConfigurations(safeAddress, requirePolicy(chainId, 'AllowPolicy'))]

  if (configurations.length > MAX_POLICY_CONFIGURATIONS) throw new Error(TOO_MANY_CONFIGURATIONS_ERROR)

  return configurations
}

export const buildAllowlistConfigurations = (chainId: string, rules: AllowlistRule[]): PolicyConfiguration[] => {
  if (rules.length === 0 || rules.some(({ recipients }) => recipients.length === 0)) {
    throw new Error(EMPTY_ALLOWLIST_ERROR)
  }
  // A zero-address target with the native selector is the guard's catch-all access, not a recipient
  if (rules.some(({ recipients }) => recipients.some((recipient) => sameAddress(recipient, ZERO_ADDRESS)))) {
    throw new Error(ZERO_ADDRESS_RECIPIENT_ERROR)
  }

  const configurations = rules.flatMap(({ tokenAddress, recipients }): PolicyConfiguration[] => {
    if (sameAddress(tokenAddress, ZERO_ADDRESS)) {
      const policy = requirePolicy(chainId, 'NativeTransferPolicy')

      return recipients.map((recipient) => ({
        target: recipient,
        selector: NATIVE_TRANSFER_SELECTOR,
        operation: OperationType.Call,
        policy,
        data: '0x',
      }))
    }

    return [
      {
        target: tokenAddress,
        selector: ERC20_TRANSFER_SELECTOR,
        operation: OperationType.Call,
        policy: requirePolicy(chainId, 'ERC20TransferPolicy'),
        data: encodeErc20TransferPolicyData(recipients),
      },
    ]
  })

  if (configurations.length > MAX_POLICY_CONFIGURATIONS) throw new Error(TOO_MANY_CONFIGURATIONS_ERROR)

  return configurations
}
