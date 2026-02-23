import { shouldDisplayPreciseBalance } from './balance'

describe('shouldDisplayPreciseBalance', () => {
  it('returns true for balance amounts with less than 8 digits before the decimal point', () => {
    expect(shouldDisplayPreciseBalance('210.2122')).toBe(true)
    expect(shouldDisplayPreciseBalance('5.2213')).toBe(true)
    expect(shouldDisplayPreciseBalance('1234567.89')).toBe(true)
  })

  it('returns false for balance amounts with 8 or more digits before the decimal point', () => {
    expect(shouldDisplayPreciseBalance('83892893298.3838')).toBe(false)
    expect(shouldDisplayPreciseBalance('12345678.1234')).toBe(false)
    expect(shouldDisplayPreciseBalance('10000000.00')).toBe(false)
  })

  it('handles balance amounts without a decimal point', () => {
    expect(shouldDisplayPreciseBalance('1234567')).toBe(true)
    expect(shouldDisplayPreciseBalance('12345678')).toBe(false)
  })
})
