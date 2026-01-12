import { faker } from '@faker-js/faker'
import type { TransactionData, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

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
    value: faker.finance.ethereumAddress(),
    name: 'Safe',
    logoUri: null,
  },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
}

export const mockNestedTxDetails: TransactionDetails = {
  safeAddress: faker.finance.ethereumAddress(),
  txId: faker.string.uuid(),
  executedAt: null,
  txStatus: 'AWAITING_CONFIRMATIONS',
  txInfo: {
    type: TransactionInfoType.TRANSFER,
    humanDescription: null,
    sender: {
      value: faker.finance.ethereumAddress(),
      name: null,
      logoUri: null,
    },
    recipient: {
      value: faker.finance.ethereumAddress(),
      name: faker.person.fullName(),
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
      value: faker.finance.ethereumAddress(),
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
