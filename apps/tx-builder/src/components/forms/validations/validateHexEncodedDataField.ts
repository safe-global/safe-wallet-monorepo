import { isHexString } from 'ethers'
import { ValidateResult } from 'react-hook-form'

import { getCustomDataError } from '../../../utils'

const validateHexEncodedDataField = (value: string): ValidateResult => {
  if (!isHexString(value)) {
    return getCustomDataError(value)
  }
}

export default validateHexEncodedDataField
