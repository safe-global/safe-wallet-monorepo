import { NO_TOKEN_SELECTED_ERROR, validateSpendingLimitAmount } from '@/features/spending-limits/services'

describe('CreateSpendingLimit', () => {
  describe('validateSpendingLimit', () => {
    it('should return no error if the amount is valid', () => {
      const result1 = validateSpendingLimitAmount('9999999999.999999999999999999', 18)
      expect(result1).toBeUndefined()

      const result2 = validateSpendingLimitAmount('0.000000000000000001', 18)
      expect(result2).toBeUndefined()
    })

    it('should return an error is the amount if too big', () => {
      const result = validateSpendingLimitAmount('100000000000000000000', 18)

      expect(result).toEqual('Amount is too big')
    })

    it('should return an error if the amount is too small', () => {
      const result = validateSpendingLimitAmount('0.0000000000000000001', 18)

      expect(result).toEqual('Amount is too small')
    })

    it('should return an error when the token decimals are unknown', () => {
      expect(validateSpendingLimitAmount('1')).toEqual(NO_TOKEN_SELECTED_ERROR)
      expect(validateSpendingLimitAmount('1.1', null)).toEqual(NO_TOKEN_SELECTED_ERROR)
    })
  })
})
