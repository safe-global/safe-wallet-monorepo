import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { OperationType } from '@safe-global/types-kit'

import type { SafeTransaction } from '@safe-global/types-kit'
import EthSafeTransaction from '@safe-global/protocol-kit/dist/src/utils/transactions/SafeTransaction'
import { TransactionStatus } from '@safe-global/safe-apps-sdk'

export const createMockTransactionDetails = ({
  txInfo,
  txData,
  detailedExecutionInfo,
}: {
  txInfo: TransactionDetails['txInfo']
  txData: TransactionDetails['txData']
  detailedExecutionInfo: TransactionDetails['detailedExecutionInfo']
}): TransactionDetails => ({
  safeAddress: 'sep:0xE20CcFf2c38Ef3b64109361D7b7691ff2c7D5f67',
  txId: 'multisig_0xBd69b0a9DC90eB6F9bAc3E4a5875f437348b6415_0xcb83bc36cf4a2998e7fe222e36c458c59c3778f65b4e5bb361c29a73c2de62cc',
  txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
  txInfo,
  txData,
  detailedExecutionInfo,
})

// TODO: Replace with safeTxBuilder
export const createMockSafeTransaction = ({
  to,
  data,
  operation = OperationType.Call,
  value,
}: {
  to: string
  data: string
  operation?: OperationType
  value?: string
}): SafeTransaction => {
  return new EthSafeTransaction({
    to,
    data,
    operation,
    value: value || '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: ZERO_ADDRESS,
    nonce: 0,
    refundReceiver: ZERO_ADDRESS,
    safeTxGas: '0',
  })
}
