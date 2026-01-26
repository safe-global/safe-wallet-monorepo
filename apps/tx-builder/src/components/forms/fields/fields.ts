// based on https://docs.soliditylang.org/en/v0.8.11/abi-spec.html#types

// int<M> or uint<M>
// M bits, 0 < M <= 256, M % 8 == 0
// see https://docs.soliditylang.org/en/v0.8.11/abi-spec.html#types
const intFieldTypeRegex = new RegExp(
  /^(u?int)(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?$/,
)
export const BASIC_INT_FIELD_TYPE = 'int' // equivalent to int256
export const BASIC_UINT_FIELD_TYPE = 'uint' // equivalent to uint256

export const ADDRESS_FIELD_TYPE = 'address' // equivalent to uint160

export const BOOLEAN_FIELD_TYPE = 'bool' // equivalent to uint8 restricted to the values 0 and 1

// bytes<M>
// M bytes, 0 < M <= 32
// see https://docs.soliditylang.org/en/v0.8.11/abi-spec.html#types
const bytesFieldTypeRegex = new RegExp(/^bytes([1-9]|[1-2][0-9]|3[0-2])?$/)

export const STRING_FIELD_TYPE = 'string' // dynamic sized unicode string assumed to be UTF-8 encoded

export const FUNCTION_FIELD_TYPE = 'function'

// ufixed<M>x<N> or fixed<M>x<N>
// M bits, 0 < M <= 256, M % 8 == 0
// N decimals, 0 < N <= 80, Represents how many decimal points are available,
// see https://docs.soliditylang.org/en/develop/types.html#fixed-point-numbers
// Fixed point types are not implemented yet in Solidity
const fixedFieldTypeRegex = new RegExp(
  /^(u?fixed)((8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)x([1-9]|[1-7][0-9]|80))?$/,
)

// <type>[] or <type>[size]
// variable-length or fixed-length Array of elements of the given type
const arrayFieldTypeRegex = new RegExp(/[^\]](\[([1-9]+[0-9]*)?\])$/)

// <type>[][], <type>[size][], <type>[][size] or <type>[size][size]
// variable-length or fixed-length Matrix of elements of the given type
const matrixFieldTypeRegex = new RegExp(/[^\]]((\[([1-9]+[0-9]*)?\]){2,2})$/)

// <type>[][][][]...,  <type>[][size][][size][][size]..., <type>[size][size][size][size]...
// MultiDimensional Arrays of elements of the given type
const multiDimensionalArrayFieldTypeRegex = new RegExp(/[^\]]((\[([1-9]+[0-9]*)?\]){3,})$/)

// Types can be combined to a tuple
const tupleFieldTypeRegex = new RegExp(/^tuple/)

export const isAddressFieldType = (fieldType: string): boolean => fieldType === ADDRESS_FIELD_TYPE
export const isBooleanFieldType = (fieldType: string): boolean => fieldType === BOOLEAN_FIELD_TYPE
export const isIntFieldType = (fieldType: string): boolean => intFieldTypeRegex.test(fieldType)
export const isBytesFieldType = (fieldType: string): boolean => bytesFieldTypeRegex.test(fieldType)
export const isStringFieldType = (fieldType: string): boolean => fieldType === STRING_FIELD_TYPE
export const isFunctionFieldType = (fieldType: string): boolean => fieldType === FUNCTION_FIELD_TYPE
export const isFixedFieldType = (fieldType: string): boolean => fixedFieldTypeRegex.test(fieldType)
export const isArrayFieldType = (fieldType: string): boolean => arrayFieldTypeRegex.test(fieldType)
export const isMatrixFieldType = (fieldType: string): boolean => matrixFieldTypeRegex.test(fieldType)
export const isMultiDimensionalArrayFieldType = (fieldType: string): boolean =>
  multiDimensionalArrayFieldTypeRegex.test(fieldType)
export const isTupleFieldType = (fieldType: string): boolean => tupleFieldTypeRegex.test(fieldType)

// bool[] or bool[size]
export const isArrayOfBooleansFieldType = (fieldType: string): boolean =>
  fieldType.startsWith(BOOLEAN_FIELD_TYPE) && isArrayFieldType(fieldType)

// bool[][], bool[size][], bool[][size] or bool[size][size]
export const isMatrixOfBooleansFieldType = (fieldType: string): boolean =>
  fieldType.startsWith(BOOLEAN_FIELD_TYPE) && isMatrixFieldType(fieldType)

// bool[][][][]...,  bool[][size][][size][][size]..., bool[size][size][size][size]...
export const isMultiDimensionalArrayOfBooleansFieldType = (fieldType: string): boolean =>
  fieldType.startsWith(BOOLEAN_FIELD_TYPE) && isMultiDimensionalArrayFieldType(fieldType)

// int[] or int[size]
// uint[] or uint[size]
export const isArrayOfIntsFieldType = (fieldType: string): boolean =>
  (fieldType.startsWith(BASIC_INT_FIELD_TYPE) || fieldType.startsWith(BASIC_UINT_FIELD_TYPE)) &&
  isArrayFieldType(fieldType)

// int[][], int[size][], int[][size] or int[size][size]
// uint[][], uint[size][], uint[][size] or uint[size][size]
export const isMatrixOfIntsFieldType = (fieldType: string): boolean =>
  (fieldType.startsWith(BASIC_INT_FIELD_TYPE) || fieldType.startsWith(BASIC_UINT_FIELD_TYPE)) &&
  isMatrixFieldType(fieldType)

// int[][][][]...,  int[][size][][size][][size]..., int[size][size][size][size]...
// uint[][][][]...,  uint[][size][][size][][size]..., uint[size][size][size][size]...
export const isMultiDimensionalArrayOfIntsFieldType = (fieldType: string): boolean =>
  (fieldType.startsWith(BASIC_INT_FIELD_TYPE) || fieldType.startsWith(BASIC_UINT_FIELD_TYPE)) &&
  isMultiDimensionalArrayFieldType(fieldType)

export const isArrayOfStringsFieldType = (fieldType: string): boolean =>
  fieldType.startsWith(STRING_FIELD_TYPE) && isArrayFieldType(fieldType)

export const isMatrixOfStringsFieldType = (fieldType: string): boolean =>
  fieldType.startsWith(STRING_FIELD_TYPE) && isMatrixFieldType(fieldType)

export const isMultiDimensionalArrayOfStringsFieldType = (fieldType: string): boolean =>
  fieldType.startsWith(STRING_FIELD_TYPE) && isMultiDimensionalArrayFieldType(fieldType)

// NON NON_SOLIDITY_TYPES

// native token amount field
export const NATIVE_AMOUNT_FIELD_TYPE = 'nativeAmount'

// selected contract method field
export const CONTRACT_METHOD_FIELD_TYPE = 'contractMethod'

// encoded hex data field
export const CUSTOM_TRANSACTION_DATA_FIELD_TYPE = 'customTransactionData'

// text field
export const TEXT_FIELD_TYPE = 'text'

export const NON_SOLIDITY_TYPES = [
  TEXT_FIELD_TYPE,
  NATIVE_AMOUNT_FIELD_TYPE,
  CONTRACT_METHOD_FIELD_TYPE,
  CUSTOM_TRANSACTION_DATA_FIELD_TYPE,
]
