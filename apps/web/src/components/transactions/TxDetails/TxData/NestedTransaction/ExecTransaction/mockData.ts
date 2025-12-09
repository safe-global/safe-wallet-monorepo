import { faker } from '@faker-js/faker'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const mockToAddress = faker.finance.ethereumAddress()

export const mockExecTransactionData: TransactionData = {
  hexData: '0x6a761202' + '0'.repeat(600), // execTransaction method signature + padding
  dataDecoded: {
    method: 'execTransaction',
    parameters: [
      {
        name: 'to',
        type: 'address',
        value: mockToAddress,
        valueDecoded: null,
      },
      {
        name: 'value',
        type: 'uint256',
        value: '1000000000000000000',
        valueDecoded: null,
      },
      {
        name: 'data',
        type: 'bytes',
        value: '0x',
        valueDecoded: null,
      },
      {
        name: 'operation',
        type: 'uint8',
        value: '0',
        valueDecoded: null,
      },
      {
        name: 'safeTxGas',
        type: 'uint256',
        value: '0',
        valueDecoded: null,
      },
      {
        name: 'baseGas',
        type: 'uint256',
        value: '0',
        valueDecoded: null,
      },
      {
        name: 'gasPrice',
        type: 'uint256',
        value: '0',
        valueDecoded: null,
      },
      {
        name: 'gasToken',
        type: 'address',
        value: '0x0000000000000000000000000000000000000000',
        valueDecoded: null,
      },
      {
        name: 'refundReceiver',
        type: 'address',
        value: '0x0000000000000000000000000000000000000000',
        valueDecoded: null,
      },
      {
        name: 'signatures',
        type: 'bytes',
        value: '0x00',
        valueDecoded: null,
      },
    ],
  },
  to: {
    value: faker.finance.ethereumAddress(),
    name: 'Nested Safe',
    logoUri: null,
  },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
}
