import type { TransactionData, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import { mockAddress } from '@/stories/mocks/address'

export const mockOnChainConfirmationData: TransactionData = {
  hexData:
    '0x8d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000f2001122334455667788990011223344556677889900112233445566778899001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
  dataDecoded: {
    method: 'approveHash',
    parameters: [
      {
        name: 'hashToApprove',
        type: 'bytes32',
        value: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        valueDecoded: null,
      },
    ],
  },
  to: {
    value: mockAddress(1),
    name: 'Safe',
    logoUri: null,
  },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
}

export const mockNestedTxDetails: TransactionDetails = {
  safeAddress: mockAddress(2),
  txId: '3f8c2a6e-9b1d-4c7a-8e5f-2d4b6a8c0e1f',
  executedAt: null,
  txStatus: 'AWAITING_CONFIRMATIONS',
  txInfo: {
    type: TransactionInfoType.TRANSFER,
    humanDescription: null,
    sender: {
      value: mockAddress(3),
      name: null,
      logoUri: null,
    },
    recipient: {
      value: mockAddress(4),
      name: 'Alice Johnson',
      logoUri: null,
    },
    direction: 'OUTGOING',
    transferInfo: {
      type: 'NATIVE_COIN',
      value: '1000000000000000000',
    },
  },
  txData: {
    hexData: '0x',
    dataDecoded: null,
    to: {
      value: mockAddress(5),
      name: null,
      logoUri: null,
    },
    value: '1000000000000000000',
    operation: 0,
    trustedDelegateCallTarget: null,
    addressInfoIndex: null,
  },
  detailedExecutionInfo: null,
  txHash: null,
  safeAppInfo: null,
}
