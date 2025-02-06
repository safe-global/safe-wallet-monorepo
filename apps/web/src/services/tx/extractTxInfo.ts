import type { OperationType } from '@safe-global/safe-core-sdk-types'
import { type SafeTransactionData } from '@safe-global/safe-core-sdk-types'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { Operation } from '@safe-global/safe-gateway-typescript-sdk'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'

const ZERO_ADDRESS: string = '0x0000000000000000000000000000000000000000'

/**
 * Convert the CGW tx type to a Safe Core SDK tx
 */
const extractTxInfo = (
  txDetails: TransactionDetails,
): { txParams: SafeTransactionData; signatures: Record<string, string> } => {
  const execInfo = isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
    ? txDetails.detailedExecutionInfo
    : undefined
  const txData = txDetails?.txData

  // Format signatures into a map
  const signatures =
    execInfo?.confirmations.reduce(
      (result, item) => {
        result[item.signer.value] = item.signature ?? ''
        return result
      },
      {} as Record<string, string>,
    ) ?? {}

  const nonce = execInfo?.nonce ?? 0
  const baseGas = execInfo?.baseGas ?? '0'
  const gasPrice = execInfo?.gasPrice ?? '0'
  const safeTxGas = execInfo?.safeTxGas ?? '0'
  const gasToken = execInfo?.gasToken ?? ZERO_ADDRESS
  const refundReceiver = execInfo?.refundReceiver.value ?? ZERO_ADDRESS

  const to = txData?.to.value ?? ZERO_ADDRESS
  const value = txData?.value ?? '0'
  const data = txData?.hexData ?? '0x'
  const operation = (txData?.operation ?? Operation.CALL) as unknown as OperationType

  return {
    txParams: {
      data,
      baseGas,
      gasPrice,
      safeTxGas,
      gasToken,
      nonce,
      refundReceiver,
      value,
      to,
      operation,
    },
    signatures,
  }
}

export default extractTxInfo
