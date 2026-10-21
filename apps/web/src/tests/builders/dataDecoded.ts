import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type {
  BaseDataDecoded,
  DataDecodedParameter,
  MultiSend,
  MultiSendTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation, TransactionInfoType } from '@safe-global/store/gateway/types'
import { transactionDataBuilder } from '@/tests/builders/transactionDetails'

type DecodedValue = string | DecodedValue[]

type Param = [name: string, type: string, value: DecodedValue]

type DecodedAction = MultiSend & { dataDecoded: BaseDataDecoded }

const SELECTOR_HEX_LENGTH = 8
const WORD_HEX_LENGTH = 64
const BYTES16_ZERO = `0x${'0'.repeat(WORD_HEX_LENGTH / 2)}`
const BYTES32_ZERO = `0x${'0'.repeat(WORD_HEX_LENGTH)}`
const MULTI_SEND_SELECTOR = '0x8d80ff0a'

export const HUGE_UINT = '6426191757410075707'

// Values are shaped like the decoder service output: numbers and booleans as strings, tuples as lists
const basicTypesCalls = (address: string): Array<[method: string, params: Param[]]> => [
  [
    'testManyArrayOfIntParams',
    [
      ['int8DynamicArrayNewValue', 'int8[]', ['5']],
      ['int128DynamicArrayNewValue', 'int128[]', ['128']],
      ['int256DynamicArrayNewValue', 'int256[]', ['128']],
      ['uInt8DynamicArrayNewValue', 'uint8[]', ['128']],
      ['uInt128DynamicArrayNewValue', 'uint128[]', ['128']],
      ['uInt256DynamicArrayNewValue', 'uint256[]', [HUGE_UINT]],
      ['int8FixedArrayNewValue', 'int8[3]', ['1', '2', '3']],
      ['int128FixedArrayNewValue', 'int128[3]', ['1', '-2', '100']],
      ['int256FixedArrayNewValue', 'int256[3]', ['1', '2', '3']],
      ['uInt8FixedArrayNewValue', 'uint8[3]', ['1', '2', '3']],
      ['uInt128FixedArrayNewValue', 'uint128[3]', ['1', '2', '3']],
      ['uInt256FixedArrayNewValue', 'uint256[3]', ['1', '2', '3']],
    ],
  ],
  [
    'testManyIntValues',
    [
      ['int8NewValue', 'int8', '8'],
      ['int32NewValue', 'int32', '-32'],
      ['int128NewValue', 'int128', '128'],
      ['int256NewValue', 'int256', '-56'],
      ['uInt8NewValue', 'uint8', '0'],
      ['uInt32NewValue', 'uint32', '32'],
      ['uInt128NewValue', 'uint128', '128'],
      ['uInt256NewValue', 'uint256', HUGE_UINT],
    ],
  ],
  [
    'testManyValues',
    [
      ['int8NewValue', 'int8', '5'],
      ['boolNewValue', 'bool', 'True'],
      ['addressNewValue', 'address', address],
      ['bytesNewValue', 'bytes', '0x'],
      ['multidimensionalArrayOfBooleansNewValue', 'bool[][][2]', [[[]], [['True'], ['False']]]],
      ['contractOwnerNewValue', 'tuple', ['hola', '12', address, 'True']],
    ],
  ],
  ['testMultidimensionalArrayOBooleans', [['newValue', 'bool[][][2]', [[[]], [['True'], ['False']]]]]],
  [
    'testMultidimensionalArrayOfInts',
    [
      [
        'newValue',
        'int128[2][][]',
        [
          [['1', '2']],
          [
            ['2', '3'],
            ['4', '5'],
          ],
          [],
        ],
      ],
    ],
  ],
  ['testSimpleTuple', [['newContractOwner', 'tuple', ['hola', '12', address, 'True']]]],
  ['testStringDynamicArrayValue', [['newValue', 'string[]', ['Batma n', 'robin']]]],
  ['testStringFixedArrayValue', [['newValue', 'string[5]', ['salsa', 'tequila', 'corazon', 'cerveza', '']]]],
  ['testStringValue', [['newValue', 'string', 'Doritos']]],
  ['testUInt8FixedArrayValue', [['newValue', 'uint8[3]', ['2', '4', '5']]]],
  ['testUInt256DynamicArrayValue', [['newValue', 'uint256[]', ['40', '50', '77', '0']]]],
  ['testAddressDynamicArrayValue', [['newValue', 'address[]', [address]]]],
  ['testAddressFixedArrayValue', [['newValue', 'address[2]', [address, address]]]],
  ['testBooleanDynamicArrayValue', [['newValue', 'bool[]', ['True', 'False']]]],
  ['testBooleanFixedArrayValue', [['newValue', 'bool[5]', ['True', 'False', 'False', 'True', 'False']]]],
  ['testBooleanValue', [['newValue', 'bool', 'False']]],
  ['testBytes16DynamicArrayValue', [['newValue', 'bytes16[]', [BYTES16_ZERO, BYTES16_ZERO]]]],
  ['testBytes16Value', [['newValue', 'bytes16', '0xff123123123123123123123123000000']]],
  ['testBytes1DynamicArrayValue', [['newValue', 'bytes1[]', ['0x00', '0x00', '0x00']]]],
  ['testBytes1FixedArrayValue', [['newValue', 'bytes1[3]', ['0xff', '0xff', '0xff']]]],
  ['testBytes2Value', [['newValue', 'bytes2', '0x0000']]],
  ['testBytes32DynamicArrayValue', [['newValue', 'bytes32[]', [BYTES32_ZERO, BYTES32_ZERO, BYTES32_ZERO]]]],
  ['testBytesDynamicArrayValue', [['newValue', 'bytes[]', ['0x', '0x', '0x']]]],
  ['testBytesFixedArrayValue', [['newValue', 'bytes[3]', ['0xff', '0x', address.toLowerCase()]]]],
  ['testBytesValue', [['newValue', 'bytes', '0xff']]],
  ['testInt256DynamicArrayValue', [['newValue', 'int256[]', ['-8', '7', '8']]]],
  ['testInt32Value', [['newValue', 'int32', '2']]],
]

const toParameter = ([name, type, value]: Param): DataDecodedParameter => ({
  name,
  type,
  // Nested arrays and tuples are valid decoder output but wider than the generated type
  value: value as DataDecodedParameter['value'],
})

// Mirrors the Transaction Builder batch QA uses against BasicTypesTestContract
export const basicTypesActions = (contract = checksumAddress(faker.finance.ethereumAddress())): DecodedAction[] => {
  const address = checksumAddress(faker.finance.ethereumAddress())

  return basicTypesCalls(address).map(([method, params]) => ({
    operation: Operation.CALL,
    to: contract,
    value: '0',
    data: faker.string.hexadecimal({ length: SELECTOR_HEX_LENGTH + WORD_HEX_LENGTH, casing: 'lower' }),
    dataDecoded: { method, parameters: params.map(toParameter) },
  }))
}

export const multiSendTxInfo = (actionCount: number): MultiSendTransactionInfo => ({
  type: TransactionInfoType.CUSTOM,
  humanDescription: null,
  to: { value: checksumAddress(faker.finance.ethereumAddress()) },
  dataSize: '0',
  value: '0',
  methodName: 'multiSend',
  actionCount,
  isCancellation: false,
})

export const multiSendTxDataBuilder = (actions: MultiSend[] = basicTypesActions()) =>
  transactionDataBuilder().with({
    hexData: `${MULTI_SEND_SELECTOR}${faker.string.hexadecimal({ length: WORD_HEX_LENGTH, casing: 'lower', prefix: '' })}`,
    operation: Operation.DELEGATE,
    dataDecoded: {
      method: 'multiSend',
      parameters: [{ name: 'transactions', type: 'bytes', value: '0x', valueDecoded: actions }],
    },
  })
