import { formatAmountPrecise, formatAmount, formatCurrency, formatCurrencyPrecise } from '@/utils/formatNumber'

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
      expect(formatCurrency(285.1257657, 'EUR')).toBe('€ 285')
    })

    it('should abbreviate billions', () => {
      expect(formatCurrency(12_345_678_901, 'USD')).toBe('$ 12.35B')
    })

    it('should abbreviate millions', () => {
      expect(formatCurrency(9_589_009.543645, 'EUR')).toBe('€ 9.59M')
    })

    it('should abbreviate thousands', () => {
      expect(formatCurrency(119_589.543645, 'EUR')).toBe('€ 119.59K')
    })

    it('should abbreviate a number with more than a given amount of digits', () => {
      expect(formatCurrency(1234.12, 'USD', 4)).toBe('$ 1.23K')
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
})
