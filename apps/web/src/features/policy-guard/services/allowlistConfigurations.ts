import { AbiCoder } from 'ethers'
import { OperationType } from '@safe-global/types-kit'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import type { AllowlistRule } from '@/features/spaces'
import {
  NATIVE_POLICY_UNAVAILABLE_ERROR,
  TOO_MANY_CONFIGURATIONS_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { PolicyConfiguration } from '../types'
import { getPolicyEngineAddress } from './policyEngineDeployments'

export const MAX_POLICY_CONFIGURATIONS = 100

const ERC20_TRANSFER_SELECTOR = ERC20__factory.createInterface().getFunction('transfer').selector
const NATIVE_TRANSFER_SELECTOR = '0x00000000'
const PERMISSION_ALWAYS = 2

export const encodeErc20TransferPolicyData = (recipients: string[]): string =>
  AbiCoder.defaultAbiCoder().encode(
    ['tuple(address recipient, uint8 permission)[]'],
    [recipients.map((recipient) => [recipient, PERMISSION_ALWAYS])],
  )

export const buildAllowlistConfigurations = (chainId: string, rules: AllowlistRule[]): PolicyConfiguration[] => {
  const configurations = rules.flatMap(({ tokenAddress, recipients }): PolicyConfiguration[] => {
    if (sameAddress(tokenAddress, ZERO_ADDRESS)) {
      const policy = getPolicyEngineAddress(chainId, 'NativeTransferPolicy')
      if (!policy) throw new Error(NATIVE_POLICY_UNAVAILABLE_ERROR)

      return recipients.map((recipient) => ({
        target: recipient,
        selector: NATIVE_TRANSFER_SELECTOR,
        operation: OperationType.Call,
        policy,
        data: '0x',
      }))
    }

    const policy = getPolicyEngineAddress(chainId, 'ERC20TransferPolicy')
    if (!policy) throw new Error(`ERC20TransferPolicy is not deployed on chain ${chainId}`)

    return [
      {
        target: tokenAddress,
        selector: ERC20_TRANSFER_SELECTOR,
        operation: OperationType.Call,
        policy,
        data: encodeErc20TransferPolicyData(recipients),
      },
    ]
  })

  if (configurations.length > MAX_POLICY_CONFIGURATIONS) throw new Error(TOO_MANY_CONFIGURATIONS_ERROR)

  return configurations
}
