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
import { getPolicyEngineAddress, type PolicyEngineContract } from './policyEngineDeployments'

export const MAX_POLICY_CONFIGURATIONS = 100

const ERC20_TRANSFER_SELECTOR = ERC20_INTERFACE.getFunction('transfer').selector
const PERMISSION_ALWAYS = 2

export const encodeErc20TransferPolicyData = (recipients: string[]): string =>
  AbiCoder.defaultAbiCoder().encode(
    ['tuple(address recipient, uint8 permission)[]'],
    [recipients.map((recipient) => [recipient, PERMISSION_ALWAYS])],
  )

export const requirePolicy = (chainId: string, contract: PolicyEngineContract): string => {
  const policy = getPolicyEngineAddress(chainId, contract)
  if (!policy) throw new Error(ALLOWLIST_UNAVAILABLE_ERROR)
  return policy
}

export const decodeErc20TransferPolicyData = (data: string): string[] => {
  const [entries] = AbiCoder.defaultAbiCoder().decode(['tuple(address recipient, uint8 permission)[]'], data)
  return entries.map(({ recipient }: { recipient: string }) => recipient)
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
