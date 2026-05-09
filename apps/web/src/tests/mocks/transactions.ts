import type { TransactionInfo, TransferInfo } from '@safe-global/store/gateway/types'

import {
  ConflictType,
  DetailedExecutionInfoType,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
  TransactionTokenType,
  TransferDirection,
} from '@safe-global/store/gateway/types'

import type {
  AddressInfo,
  MultisigExecutionInfo,
  ModuleTransaction,
  Transaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const mockAddressEx: AddressInfo = {
  value: 'string',
}

const mockTransferInfo: TransferInfo = {
  type: TransactionTokenType.ERC20,
  tokenAddress: 'string',
  value: 'string',
  trusted: true,
  imitation: false,
}

const mockTxInfo: TransactionInfo = {
  type: TransactionInfoType.TRANSFER,
  sender: mockAddressEx,
  recipient: mockAddressEx,
  direction: TransferDirection.OUTGOING,
  transferInfo: mockTransferInfo,
}

export const defaultTx: Transaction = {
  id: '',
  timestamp: 0,
  txInfo: mockTxInfo,
  txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
  executionInfo: {
    type: DetailedExecutionInfoType.MULTISIG,
    nonce: 1,
    confirmationsRequired: 2,
    confirmationsSubmitted: 2,
  },
  txHash: null,
}

export const getMockTx = ({ nonce }: { nonce?: number }): ModuleTransaction => {
  return {
    transaction: {
      ...defaultTx,
      executionInfo: {
        ...defaultTx.executionInfo,
        nonce: nonce ?? (defaultTx.executionInfo as MultisigExecutionInfo).nonce,
      } as MultisigExecutionInfo,
    },
    type: TransactionListItemType.TRANSACTION,
    conflictType: ConflictType.NONE,
  }
}
