import type { OperationType } from '@safe-global/safe-core-sdk-types'
import { type SafeTransactionData } from '@safe-global/safe-core-sdk-types'
import { Operation } from '@safe-global/safe-gateway-typescript-sdk'
import { isMultisigDetailedExecutionInfo, isNativeTokenTransfer } from '@/src/utils/transaction-guards'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const EMPTY_DATA = '0x'

/**
 * Convert the CGW tx type to a Safe Core SDK tx
 */
const extractTxInfo = (
  txDetails: TransactionDetails,
  safeAddress: string,
): { txParams: SafeTransactionData; signatures: Record<string, string> } => {
  // Format signatures into a map
  let signatures: Record<string, string> = {}
  if (isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    signatures = txDetails.detailedExecutionInfo.confirmations.reduce((result, item) => {
      result[item.signer.value] = item.signature ?? ''
      return result
    }, signatures)
  }

  const data = txDetails.txData?.hexData ?? EMPTY_DATA

  const baseGas = isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
    ? txDetails.detailedExecutionInfo.baseGas
    : '0'

  const gasPrice = isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
    ? txDetails.detailedExecutionInfo.gasPrice
    : '0'

  const safeTxGas = isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
    ? txDetails.detailedExecutionInfo.safeTxGas
    : '0'

  const gasToken = isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
    ? txDetails.detailedExecutionInfo.gasToken
    : ZERO_ADDRESS

  const nonce = isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
    ? txDetails.detailedExecutionInfo.nonce
    : 0

  const refundReceiver = isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
    ? txDetails.detailedExecutionInfo.refundReceiver.value
    : ZERO_ADDRESS

  const value = (() => {
    switch (txDetails.txInfo.type) {
      case 'Transfer':
        if (isNativeTokenTransfer(txDetails.txInfo.transferInfo)) {
          return txDetails.txInfo.transferInfo.value
        } else {
          return txDetails.txData?.value ?? '0'
        }
      case 'TwapOrder':
        return txDetails.txData?.value ?? '0'
      case 'SwapOrder':
        return txDetails.txData?.value ?? '0'
      case 'NativeStakingDeposit':
      case 'NativeStakingValidatorsExit':
      case 'NativeStakingWithdraw':
        return txDetails.txData?.value ?? '0'
      case 'Custom':
        return txDetails.txInfo.value
      case 'Creation':
      case 'SettingsChange':
        return '0'
      default: {
        throw new Error(`Unknown transaction type: ${txDetails.txInfo.type}`)
      }
    }
  })()

  const to = (() => {
    const type = txDetails.txInfo.type
    switch (type) {
      case 'Transfer':
        if (isNativeTokenTransfer(txDetails.txInfo.transferInfo)) {
          return txDetails.txInfo.recipient.value
        } else {
          return txDetails.txInfo.transferInfo.tokenAddress
        }
      case 'SwapOrder':
      case 'TwapOrder':
      case 'NativeStakingDeposit':
      case 'NativeStakingValidatorsExit':
      case 'NativeStakingWithdraw': {
        const toValue = txDetails.txData?.to.value
        if (!toValue) {
          throw new Error('Tx data does not have a `to` field')
        }
        return toValue
      }
      case 'Custom':
        return txDetails.txInfo.to.value
      case 'Creation':
      case 'SettingsChange':
        return safeAddress
      default: {
        // This should never happen as we've handled all possible cases
        throw new Error(`Unexpected transaction type: ${type}`)
      }
    }
  })()

  const operation = (txDetails.txData?.operation ?? Operation.CALL) as unknown as OperationType

  return {
    txParams: {
      data,
      baseGas,
      gasPrice,
      safeTxGas,
      gasToken,
      nonce,
      refundReceiver,
      value: value ?? '0',
      to,
      operation,
    },
    signatures,
  }
}

export default extractTxInfo
