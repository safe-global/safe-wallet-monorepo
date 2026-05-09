import { isAddress, formatEther, Interface } from 'ethers'
import { ContractInput, ContractMethod, ProposedTransaction } from './typings/models'
import {
  isArrayFieldType,
  isArrayOfStringsFieldType,
  isBooleanFieldType,
  isIntFieldType,
  isMatrixFieldType,
  isMatrixOfStringsFieldType,
  isMultiDimensionalArrayFieldType,
  isMultiDimensionalArrayOfStringsFieldType,
  isTupleFieldType,
} from './components/forms/fields/fields'

export const enum FETCH_STATUS {
  NOT_ASKED = 'NOT_ASKED',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
export class SoliditySyntaxError extends Error {}

export const parseBooleanValue = (value: string | boolean | number): boolean => {
  const isStringValue = typeof value === 'string'
  if (isStringValue) {
    const truthyStrings = ['true', 'True', 'TRUE', '1']
    const isTruthyValue = truthyStrings.some((truthyString) => truthyString === value.trim().toLowerCase())

    if (isTruthyValue) {
      return true
    }

    const falsyStrings = ['false', 'False', 'FALSE', '0']
    const isFalsyValue = falsyStrings.some((falsyString) => falsyString === value.trim().toLowerCase())

    if (isFalsyValue) {
      return false
    }

    throw new SoliditySyntaxError('Invalid Boolean value')
  }

  return !!value
}

const paramTypeNumber = new RegExp(/^(u?int)([0-9]*)(\[(?:[1-9][0-9]*)?\])*$/)
export const getNumberOfBits = (fieldType: string): number => Number(fieldType.match(paramTypeNumber)?.[2] || '256')

export const parseIntValue = (value: string, fieldType: string) => {
  const trimmedValue = value.replace(/"/g, '').replace(/'/g, '').trim()
  const isEmptyString = trimmedValue === ''

  if (isEmptyString) {
    throw new SoliditySyntaxError('invalid empty strings for integers')
  }

  const bits = getNumberOfBits(fieldType)

  // Handle hex values (with or without 0x prefix) like BN.js does
  // BN.js treats values containing a-f (case insensitive) as hex
  const isNegative = trimmedValue.startsWith('-')
  const absValue = isNegative ? trimmedValue.slice(1) : trimmedValue
  const hasHexPrefix = absValue.toLowerCase().startsWith('0x')
  const isHexWithoutPrefix = !hasHexPrefix && /^[0-9a-f]+$/i.test(absValue) && /[a-f]/i.test(absValue)

  let bigIntValue: bigint
  if (hasHexPrefix) {
    // BigInt can't handle negative hex like "-0xFF", need to handle sign separately
    bigIntValue = isNegative ? -BigInt(absValue) : BigInt(absValue)
  } else if (isHexWithoutPrefix) {
    bigIntValue = isNegative ? -BigInt('0x' + absValue) : BigInt('0x' + absValue)
  } else {
    bigIntValue = BigInt(trimmedValue)
  }

  const strValue = bigIntValue.toString(10)
  if (bigIntValue < 0n) {
    return strValue
  }
  return strValue.padStart(Math.ceil(bits / 4), '0')
}

// parse a string to an Array. Example: from "[1, 2, [3,4]]" returns [ "1", "2", "[3, 4]" ]
// use this function only for Arrays, Matrix and MultiDimensional Arrays of ints, uints, bytes, addresses and booleans
// do NOT use this function for Arrays, Matrix and MultiDimensional Arrays of strings (for strings use JSON.parse() instead)
export const parseStringToArray = (value: string): string[] => {
  let numberOfItems = 0
  let numberOfOtherArrays = 0
  return value
    .trim()
    .slice(1, -1) // remove the first "[" and the last "]"
    .split('')
    .reduce<string[]>((array, char) => {
      const isCommaChar = char === ','

      if (isCommaChar && numberOfOtherArrays === 0) {
        numberOfItems++
        return array
      }

      const isOpenArrayChar = char === '['

      if (isOpenArrayChar) {
        numberOfOtherArrays++
      }

      const isCloseArrayChar = char === ']'

      if (isCloseArrayChar) {
        numberOfOtherArrays--
      }

      array[numberOfItems] = `${array[numberOfItems] || ''}${char}`.trim()

      return array
    }, [])
}

export const baseFieldtypeRegex = new RegExp(/^([a-zA-Z0-9]*)(\[(?:[1-9][0-9]*)?\])*$/)

// return the base field type. Example: from "uint128[][2][]" returns "uint128"
export const getBaseFieldType = (fieldType: string): string => {
  const baseFieldType = fieldType.match(baseFieldtypeRegex)?.[1]

  if (!baseFieldType) {
    throw new SoliditySyntaxError(`Unknow base field type ${baseFieldType} from ${fieldType}`)
  }

  return baseFieldType
}

// custom isArray function to return true if a given string is an Array
export const isArray = (values: string): boolean => {
  const trimmedValue = values.trim()
  const isArray = trimmedValue.startsWith('[') && trimmedValue.endsWith(']')

  return isArray
}

const parseArrayOfValues = (values: string, fieldType: string): unknown => {
  if (!isArray(values)) {
    throw new SoliditySyntaxError('Invalid Array value')
  }

  return parseStringToArray(values).map((itemValue) =>
    isArray(itemValue)
      ? parseArrayOfValues(itemValue, fieldType) // recursive call because Matrix and MultiDimensional Arrays field types
      : parseInputValue(
          // recursive call to parseInputValue
          getBaseFieldType(fieldType), // based on the base field type
          itemValue.replace(/"/g, '').replace(/'/g, ''), // removing " and ' chars from the value
        ),
  )
}

// This function is used to parse the user input values
export const parseInputValue = (fieldType: string, value: string): unknown => {
  const trimmedValue = typeof value === 'string' ? value.trim() : value

  if (isBooleanFieldType(fieldType)) {
    return parseBooleanValue(trimmedValue)
  }

  if (isIntFieldType(fieldType)) {
    return parseIntValue(trimmedValue, fieldType)
  }

  // FIX: fix the issue with long numbers in the tuples
  if (isTupleFieldType(fieldType)) {
    return JSON.parse(trimmedValue)
  }

  // for Arrays, Matrix and MultiDimensional Arrays of strings JSON.parse is required
  if (
    isArrayOfStringsFieldType(fieldType) ||
    isMatrixOfStringsFieldType(fieldType) ||
    isMultiDimensionalArrayOfStringsFieldType(fieldType)
  ) {
    return JSON.parse(trimmedValue)
  }

  if (isArrayFieldType(fieldType) || isMatrixFieldType(fieldType) || isMultiDimensionalArrayFieldType(fieldType)) {
    return parseArrayOfValues(trimmedValue, fieldType)
  }

  return value
}

export const isInputValueValid = (val: string) => {
  const value = Number(val)
  const isHexValue = val?.startsWith?.('0x')
  const isNegativeValue = value < 0

  if (isNaN(value) || isNegativeValue || isHexValue) {
    return false
  }

  return true
}

export const getCustomDataError = (value: string | undefined) => {
  return `Has to be a valid strict hex data${!value?.startsWith('0x') ? ' (it must start with 0x)' : ''}`
}

export const isValidAddress = (address: string | null) => {
  if (!address) {
    return false
  }
  return isAddress(address)
}

const NON_VALID_CONTRACT_METHODS = ['receive', 'fallback']

export const encodeToHexData = (
  contractMethod: ContractMethod | undefined,
  contractFieldsValues: Record<string, string> | null | undefined,
) => {
  const contractMethodName = contractMethod?.name
  const contractFields = contractMethod?.inputs || []

  const isValidContractMethod = contractMethodName && !NON_VALID_CONTRACT_METHODS.includes(contractMethodName)

  if (isValidContractMethod) {
    try {
      const parsedValues = contractFields.map((contractField: ContractInput, index) => {
        const contractFieldName = contractField.name || String(index)
        const cleanValue = contractFieldsValues?.[contractFieldName] || ''

        return parseInputValue(contractField.type, cleanValue)
      })

      const abiItem = {
        ...contractMethod,
        type: 'function' as const,
      }
      const iface = new Interface([abiItem])
      const hexEncodedData = iface.encodeFunctionData(contractMethodName, parsedValues)

      return hexEncodedData
    } catch (error) {
      console.error('Error encoding current form values to hex data: ', error)
    }
  }
}

export const weiToEther = (wei: string) => {
  return formatEther(wei)
}

export const getTransactionText = (description: ProposedTransaction['description']) => {
  const { contractMethod, customTransactionData } = description

  const isCustomHexDataTx = !!customTransactionData
  const isContractInteractionTx = !!contractMethod
  const isTokenTransferTx = !isCustomHexDataTx && !isContractInteractionTx

  if (isTokenTransferTx) {
    return 'Transfer'
  }

  if (isCustomHexDataTx) {
    return 'Custom hex data'
  }

  if (isContractInteractionTx) {
    return contractMethod.name
  }

  // empty tx description as a fallback
  return ''
}

export const getInputTypeHelper = (input: ContractInput): string => {
  // This code renders a helper for the input text.
  if (input.type.startsWith('tuple') && input.components) {
    return `tuple(${input.components
      .map((i: ContractInput) => {
        return getInputTypeHelper(i)
      })
      .toString()})${input.type.endsWith('[]') ? '[]' : ''}`
  } else {
    return input.type
  }
}

// A Template looks like this: "https://rinkeby.etherscan.io/address/{{address}}"
// To replace ``{{address}}`` with the actual address, pass an object with the `address` key
export const evalTemplate = (templateUri: string, data: Record<string, string>): string => {
  const TEMPLATE_REGEX = /\{\{([^}]+)\}\}/g
  return templateUri.replace(TEMPLATE_REGEX, (_: string, key: string) => data[key])
}
