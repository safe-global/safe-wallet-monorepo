import { ExecutionMethod } from '@/components/tx/ExecutionMethodSelector'
import { PayMethod } from '@safe-global/utils/features/counterfactual/types'
import type { TransactionOptions } from '@safe-global/types-kit'

/**
 * Returns the pluralized network label based on the number of networks.
 */
export function getNetworkLabel(networkCount: number): string {
  return networkCount > 1 ? 'Networks' : 'Network'
}

/**
 * Returns the threshold display string, e.g. "2 out of 3 signers".
 */
export function getThresholdLabel(threshold: number, ownerCount: number): string {
  const noun = ownerCount > 1 ? 'signers' : 'signer'
  return `${threshold} out of ${ownerCount} ${noun}`
}

/**
 * Determines whether the deployment type label is "Counterfactual" or "Direct".
 */
export function getDeploymentType(isCounterfactualEnabled: boolean | undefined, payMethod: PayMethod): string {
  return isCounterfactualEnabled && payMethod === PayMethod.PayLater ? 'Counterfactual' : 'Direct'
}

/**
 * Returns the payment method analytics label.
 */
export function getPaymentMethodLabel(
  isCounterfactualEnabled: boolean | undefined,
  payMethod: PayMethod,
  willRelay: boolean,
): string {
  if (isCounterfactualEnabled && payMethod === PayMethod.PayLater) {
    return 'Pay-later'
  }
  return willRelay ? 'Sponsored' : 'Self-paid'
}

/**
 * Determines whether the network warning banner should be shown on the review step.
 */
export function shouldShowNetworkWarning(
  isWrongChain: boolean,
  payMethod: PayMethod,
  willRelay: boolean,
  isMultiChainDeployment: boolean,
  isCounterfactualEnabled: boolean | undefined,
): boolean {
  const paynowCondition = isWrongChain && payMethod === PayMethod.PayNow && !willRelay && !isMultiChainDeployment
  const nonCounterfactualCondition = isWrongChain && !isCounterfactualEnabled && !isMultiChainDeployment
  return paynowCondition || nonCounterfactualCondition
}

/**
 * Builds EIP-1559 or legacy transaction options depending on chain support.
 */
export function buildTransactionOptions(
  isEIP1559: boolean,
  maxFeePerGas: bigint | null | undefined,
  maxPriorityFeePerGas: bigint | null | undefined,
  gasLimit: bigint | null | undefined,
): TransactionOptions {
  if (isEIP1559) {
    return {
      maxFeePerGas: maxFeePerGas?.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
      gasLimit: gasLimit?.toString(),
    }
  }
  return {
    gasPrice: maxFeePerGas?.toString(),
    gasLimit: gasLimit?.toString(),
  }
}

/**
 * Determines whether the relay execution method will be used.
 */
export function getWillRelay(canRelay: boolean, executionMethod: ExecutionMethod): boolean {
  return canRelay && executionMethod === ExecutionMethod.RELAY
}
