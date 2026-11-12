import type {
  BaseDataDecoded,
  DataDecodedParameter,
  MultiSend,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation } from '@safe-global/store/gateway/types'
import { mockAddress } from '@/stories/mocks/address'

type DecodedValue = string | DecodedValue[]

type Param = [name: string, type: string, value: DecodedValue]

type DecodedAction = MultiSend & { dataDecoded: BaseDataDecoded }

const BYTES16_ZERO = `0x${'0'.repeat(32)}`
const BYTES32_ZERO = `0x${'0'.repeat(64)}`
const ACTION_DATA = '0xa9059cbb000000000000000000000000000000000000000000000000000000000000002a'

export const HUGE_UINT = '6426191757410075707'

const CONTRACT_ADDRESS = mockAddress(1)
const VALUE_ADDRESS = mockAddress(2)

// Values are shaped like the decoder service output: numbers and booleans as strings, tuples as lists
const basicTypesCalls: Array<[method: string, params: Param[]]> = [
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
      ['addressNewValue', 'address', VALUE_ADDRESS],
      ['bytesNewValue', 'bytes', '0x'],
      ['multidimensionalArrayOfBooleansNewValue', 'bool[][][2]', [[[]], [['True'], ['False']]]],
      ['contractOwnerNewValue', 'tuple', ['hola', '12', VALUE_ADDRESS, 'True']],
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
  ['testSimpleTuple', [['newContractOwner', 'tuple', ['hola', '12', VALUE_ADDRESS, 'True']]]],
  ['testStringDynamicArrayValue', [['newValue', 'string[]', ['Batma n', 'robin']]]],
  ['testStringFixedArrayValue', [['newValue', 'string[5]', ['salsa', 'tequila', 'corazon', 'cerveza', '']]]],
  ['testStringValue', [['newValue', 'string', 'Doritos']]],
  ['testUInt8FixedArrayValue', [['newValue', 'uint8[3]', ['2', '4', '5']]]],
  ['testUInt256DynamicArrayValue', [['newValue', 'uint256[]', ['40', '50', '77', '0']]]],
  ['testAddressDynamicArrayValue', [['newValue', 'address[]', [VALUE_ADDRESS]]]],
  ['testAddressFixedArrayValue', [['newValue', 'address[2]', [VALUE_ADDRESS, VALUE_ADDRESS]]]],
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
  ['testBytesFixedArrayValue', [['newValue', 'bytes[3]', ['0xff', '0x', VALUE_ADDRESS.toLowerCase()]]]],
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
export const basicTypesActions: DecodedAction[] = basicTypesCalls.map(([method, params]) => ({
  operation: Operation.CALL,
  to: CONTRACT_ADDRESS,
  value: '0',
  data: ACTION_DATA,
  dataDecoded: { method, parameters: params.map(toParameter) },
}))
