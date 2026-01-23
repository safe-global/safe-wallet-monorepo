import { _validateSpendingLimit } from '../CreateSpendingLimit'

describe('CreateSpendingLimit', () => {
  describe('validateSpendingLimit', () => {
    it('should return no error if the amount is valid', () => {
      const result1 = _validateSpendingLimit('9999999999.999999999999999999', 18)
      expect(result1).toBeUndefined()

      const result2 = _validateSpendingLimit('0.000000000000000001', 18)
      expect(result2).toBeUndefined()
    })

    it('should return an error is the amount if too big', () => {
      const result = _validateSpendingLimit('100000000000')

      expect(result).toEqual('Amount is too big')
    })

    it('should return an error if the amount is too small', () => {
      const result = _validateSpendingLimit('0.0000000000000000001')

      expect(result).toEqual('Amount is too small')
    })
  })
})
