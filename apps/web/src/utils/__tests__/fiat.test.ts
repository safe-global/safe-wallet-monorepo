import { computeFiatValue } from '../fiat'

describe('computeFiatValue', () => {
  it('should compute fiat value correctly', () => {
    expect(computeFiatValue(100, '1')).toBe(100)
  })

  it('should handle decimal token amounts', () => {
    expect(computeFiatValue(0.5, '2000')).toBe(1000)
  })

  it('should handle decimal fiat conversion rates', () => {
    expect(computeFiatValue(10, '1.5')).toBe(15)
  })

  it('should return null when fiatConversion is undefined', () => {
    expect(computeFiatValue(100, undefined)).toBeNull()
  })

  it('should return null when fiatConversion is empty string', () => {
    expect(computeFiatValue(100, '')).toBeNull()
  })

  it('should return null when fiatConversion is "0"', () => {
    expect(computeFiatValue(100, '0')).toBeNull()
  })

  it('should return null when fiatConversion is "0.00"', () => {
    expect(computeFiatValue(100, '0.00')).toBeNull()
  })

  it('should return null when fiatConversion is "0.0000"', () => {
    expect(computeFiatValue(100, '0.0000')).toBeNull()
  })

  it('should return null when tokenAmount is 0', () => {
    expect(computeFiatValue(0, '1')).toBeNull()
  })

  it('should return null when tokenAmount is negative', () => {
    expect(computeFiatValue(-5, '1')).toBeNull()
  })

  it('should return null when tokenAmount is NaN', () => {
    expect(computeFiatValue(NaN, '1')).toBeNull()
  })
})
