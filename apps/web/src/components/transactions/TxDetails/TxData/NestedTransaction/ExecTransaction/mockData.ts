import { faker } from '@faker-js/faker'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Safe__factory } from '@safe-global/utils/types/contracts'

// Seed faker for deterministic addresses in stories
faker.seed(42)

const mockToAddress = faker.finance.ethereumAddress()
const mockNestedSafeAddress = faker.finance.ethereumAddress()

// Generate valid ABI-encoded execTransaction calldata
const safeInterface = Safe__factory.createInterface()
const validExecTransactionData = safeInterface.encodeFunctionData('execTransaction', [
  mockToAddress, // to
  BigInt('1000000000000000000'), // value (1 ETH)
  '0x', // data
  0, // operation (Call)
  BigInt(0), // safeTxGas
  BigInt(0), // baseGas
  BigInt(0), // gasPrice
  '0x0000000000000000000000000000000000000000', // gasToken
  '0x0000000000000000000000000000000000000000', // refundReceiver
  '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', // signatures (dummy signature)
])

export const mockExecTransactionData: TransactionData = {
  hexData: validExecTransactionData,
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
    value: mockNestedSafeAddress,
    name: 'Nested Safe',
    logoUri: null,
  },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
}
