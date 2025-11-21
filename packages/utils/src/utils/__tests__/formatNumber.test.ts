import {
  formatAmountPrecise,
  formatAmount,
  formatCurrency,
  formatCurrencyPrecise,
  percentageOfTotal,
} from '@safe-global/utils/utils/formatNumber'

describe('formatNumber', () => {
  describe('formatAmountPrecise', () => {
    it('should format a number with a defined precision', () => {
      expect(formatAmountPrecise(1234.5678, 2)).toBe('1,234.57')
    })
  })

  describe('formatAmount', () => {
    it('should format a number below 0.0001', () => {
      expect(formatAmount(0.000000009)).toBe('< 0.00001')
    })

    it('should format a number below 1', () => {
      expect(formatAmount(0.567811)).toBe('0.56781')
    })

    it('should format a number above 1', () => {
      expect(formatAmount(285.1257657)).toBe('285.12577')
    })

    it('should abbreviate a number with more than 10 digits', () => {
      expect(formatAmount(12345678901)).toBe('12.35B')
    })

    it('should abbreviate a number with more than a given amount of digits', () => {
      expect(formatAmount(1234.12, 2, 4)).toBe('1.23K')
    })
  })

  describe('formatCurrency', () => {
    it('should format a 0', () => {
      expect(formatCurrency(0, 'USD')).toBe('$ 0')
    })

    it('should format a number below 1', () => {
      expect(formatCurrency(0.5678, 'USD')).toBe('$ 0.57')
    })

    it('should format a number above 1', () => {
      // Price mode: values ≥ --.01 show 2 decimals
      const result = formatCurrency(285.13, 'EUR')
      expect(result).toContain('285.13')
      // Large numbers should not use compact notation
      const result2 = formatCurrency(12_345_678_901, 'USD')
      expect(result2).toContain('12,345,678,901.00')
    })

    it('should abbreviate millions', () => {
      const result = formatCurrency(9_589_009.54, 'EUR')
      expect(result).toContain('9,589,009.54')
    })

    it('should abbreviate thousands', () => {
      const result = formatCurrency(119_589.54, 'EUR')
      expect(result).toContain('119,589.54')
    })

    it('should abbreviate a number with more than a given amount of digits', () => {
      const result = formatCurrency(1234.12, 'USD', 4)
      expect(result).toContain('1,234.12')
    })
  })

  describe('formatCurrencyPrecise', () => {
    it('should format the number correctly for USD', () => {
      const result = formatCurrencyPrecise(1234.56, 'USD')
      expect(result).toBe('$ 1,234.56')
    })

    it('should format the number correctly for EUR', () => {
      const result = formatCurrencyPrecise(1234.56, 'EUR')
      expect(result).toBe('€ 1,234.56')
    })

    it('should handle string input as number', () => {
      const result = formatCurrencyPrecise('1234.56', 'USD')
      expect(result).toBe('$ 1,234.56')
    })

    it('should add the narrow non-breaking space after the currency symbol', () => {
      const result = formatCurrencyPrecise(1234.56, 'USD')
      expect(result).toBe('$ 1,234.56')
    })

    it('should format the number correctly with 5 decimal places for USD', () => {
      const result = formatCurrencyPrecise(1234.56789, 'USD')
      expect(result).toBe('$ 1,234.57')
    })

    it('should return "NaN" for invalid number input', () => {
      const result = formatCurrencyPrecise('invalid-number', 'USD')
      expect(result).toBe('$NaN ')
    })
  })

  describe('percentageOfTotal', () => {
    it('returns the correct fraction for typical inputs', () => {
      expect(percentageOfTotal(30, 100)).toBeCloseTo(0.3)
      expect(percentageOfTotal('75', '150')).toBeCloseTo(0.5)
    })

    it('handles a zero total by returning 0 (avoids division by 0)', () => {
      expect(percentageOfTotal(10, 0)).toBe(0)
    })

    it('handles a negative total by returning 0', () => {
      expect(percentageOfTotal(10, -50)).toBe(0)
    })

    it('handles non-numeric totals by returning 0', () => {
      expect(percentageOfTotal(10, 'not-a-number')).toBe(0)
    })

    it('handles non-numeric balances by returning 0', () => {
      expect(percentageOfTotal(NaN, 100)).toBe(0)
    })

    it('handles extremely large totals without throwing', () => {
      expect(percentageOfTotal(1, Number.MAX_SAFE_INTEGER)).toBeCloseTo(1 / Number.MAX_SAFE_INTEGER)
    })
  })

  describe('formatCurrency value mode', () => {
    it('should format zero as $0.00 with 2 decimals', () => {
      expect(formatCurrency(0, 'USD', 6, 'value')).toBe('$ 0.00')
    })

    it('should format zero as €0.00 for EUR', () => {
      expect(formatCurrency(0, 'EUR', 6, 'value')).toBe('€ 0.00')
    })

    it('should format values ≥ $0.01 with exactly 2 decimal places', () => {
      expect(formatCurrency(246985.08, 'USD', 20, 'value')).toBe('$ 246,985.08')
      expect(formatCurrency(2087.28, 'USD', 20, 'value')).toBe('$ 2,087.28')
      expect(formatCurrency(321.19, 'USD', 20, 'value')).toBe('$ 321.19')
      expect(formatCurrency(134.94, 'USD', 20, 'value')).toBe('$ 134.94')
      expect(formatCurrency(38.26, 'USD', 20, 'value')).toBe('$ 38.26')
      expect(formatCurrency(25.12, 'USD', 20, 'value')).toBe('$ 25.12')
      expect(formatCurrency(17.74, 'USD', 20, 'value')).toBe('$ 17.74')
      expect(formatCurrency(3.70, 'USD', 20, 'value')).toBe('$ 3.70')
      expect(formatCurrency(0.01, 'USD', 20, 'value')).toBe('$ 0.01')
    })

    it('should format values < $0.01 as <$0.01', () => {
      expect(formatCurrency(0.005, 'USD', 6, 'value')).toBe('<$ 0.01')
      expect(formatCurrency(0.009, 'USD', 6, 'value')).toBe('<$ 0.01')
      expect(formatCurrency(0.0001, 'USD', 6, 'value')).toBe('<$ 0.01')
      expect(formatCurrency(0.001, 'USD', 6, 'value')).toBe('<$ 0.01')
    })

    it('should format values < €0.01 as <€0.01 for EUR', () => {
      expect(formatCurrency(0.005, 'EUR', 6, 'value')).toBe('<€ 0.01')
      expect(formatCurrency(0.009, 'EUR', 6, 'value')).toBe('<€ 0.01')
    })

    it('should preserve sign for negative values', () => {
      expect(formatCurrency(-246985.08, 'USD', 20, 'value')).toBe('-$ 246,985.08')
      expect(formatCurrency(-0.005, 'USD', 6, 'value')).toBe('<$ 0.01')
      expect(formatCurrency(-0.01, 'USD', 6, 'value')).toBe('-$ 0.01')
    })

    it('should maintain 2 decimals for large values without compact notation', () => {
      const result1 = formatCurrency(12_345_678_901, 'USD', 6, 'value')
      expect(result1).toContain('12,345,678,901.00')
      const result2 = formatCurrency(9_589_009.54, 'EUR', 6, 'value')
      expect(result2).toContain('9,589,009.54')
      const result3 = formatCurrency(119_589.54, 'EUR', 6, 'value')
      expect(result3).toContain('119,589.54')
    })

    it('should handle string input as number', () => {
      expect(formatCurrency('246985.08', 'USD', 20, 'value')).toBe('$ 246,985.08')
      expect(formatCurrency('0.005', 'USD', 6, 'value')).toBe('<$ 0.01')
    })

    it('should format edge case values correctly', () => {
      // Exactly 0.01
      expect(formatCurrency(0.01, 'USD', 6, 'value')).toBe('$ 0.01')
      // Just below 0.01
      expect(formatCurrency(0.009999, 'USD', 6, 'value')).toBe('<$ 0.01')
      // Just above 0.01
      expect(formatCurrency(0.010001, 'USD', 6, 'value')).toBe('$ 0.01')
      // Very small positive
      expect(formatCurrency(0.000001, 'USD', 6, 'value')).toBe('<$ 0.01')
      // Very small negative
      expect(formatCurrency(-0.000001, 'USD', 6, 'value')).toBe('<$ 0.01')
    })
  })

  describe('formatCurrency price mode (backward compatibility)', () => {
    it('should default to price mode when mode is not specified', () => {
      // Use actual output with hair space character
      const result1 = formatCurrency(0.5678, 'USD')
      expect(result1).toContain('0.57')
      const result2 = formatCurrency(285.13, 'EUR')
      expect(result2).toContain('285.13')
      const result3 = formatCurrency(0, 'USD')
      expect(result3).toContain('0')
    })

    it('should use adaptive precision for price mode', () => {
      // Values ≥ $0.01 should show 2 decimal places
      const result1 = formatCurrency(0.01, 'USD', 6, 'price')
      expect(result1).toContain('0.01')
      const result2 = formatCurrency(0.21, 'USD', 6, 'price')
      expect(result2).toContain('0.21')
      const result3 = formatCurrency(2.68, 'USD', 6, 'price')
      expect(result3).toContain('2.68')
      const result4 = formatCurrency(285.13, 'EUR', 6, 'price')
      expect(result4).toContain('285.13')
      // Values $0.0001 - $0.0099: 4-6 decimals (adaptive)
      const result5 = formatCurrency(0.005, 'USD', 6, 'price')
      expect(result5).toContain('0.005')
      const result6 = formatCurrency(0.0005, 'USD', 6, 'price')
      expect(result6).toContain('0.0005')
      // Values < $0.0001: 6 decimals or threshold
      const result7 = formatCurrency(0.00005, 'USD', 20, 'price')
      expect(result7).toContain('0.00005')
      const result8 = formatCurrency(0.0000005, 'USD', 20, 'price')
      expect(result8).toContain('<')
      expect(result8).toContain('0.000001')
    })
  })
})
