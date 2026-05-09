import { ValidateResult } from 'react-hook-form'
import { parseEther } from 'ethers'

import { isInputValueValid } from '../../../utils'

const INVALID_AMOUNT_ERROR = 'Invalid amount value'

const validateAmountField = (value: string): ValidateResult => {
  if (!isInputValueValid(value)) {
    return INVALID_AMOUNT_ERROR
  }

  try {
    parseEther(value)
  } catch {
    return INVALID_AMOUNT_ERROR
  }
}

export default validateAmountField
