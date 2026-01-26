import { ValidateResult } from 'react-hook-form'
import { AbiCoder } from 'ethers'

import { parseInputValue } from '../../../utils'
import { NON_SOLIDITY_TYPES } from '../fields/fields'
import { isEthersError } from '../../../typings/errors'

const abiCoder = AbiCoder.defaultAbiCoder()

const basicSolidityValidation = (value: string, fieldType: string): ValidateResult => {
  const isSolidityFieldType = !NON_SOLIDITY_TYPES.includes(fieldType)
  if (isSolidityFieldType) {
    try {
      const cleanValue = parseInputValue(fieldType, value)
      abiCoder.encode([fieldType], [cleanValue])
    } catch (error: unknown) {
      let errorMessage = error?.toString()

      const errorFromEthers = isEthersError(error)
      if (errorFromEthers) {
        if (error.reason.toLowerCase().includes('overflow')) {
          return 'Overflow error. Please encode all numbers as strings'
        }
        errorMessage = error.reason
      }

      return `format error. details: ${errorMessage}`
    }
  }
}

export default basicSolidityValidation
