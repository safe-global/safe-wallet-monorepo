import { shouldDisplayPreciseBalance, sumFiatTotals } from './balance'

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

describe('sumFiatTotals', () => {
  it('sums multiple fiat total strings', () => {
    expect(sumFiatTotals(['10.5', '20.3', '5.2'])).toBe('36')
  })

  it('returns "0" for an empty array', () => {
    expect(sumFiatTotals([])).toBe('0')
  })

  it('handles a single value', () => {
    expect(sumFiatTotals(['42.99'])).toBe('42.99')
  })

  it('handles zero values', () => {
    expect(sumFiatTotals(['0', '0', '0'])).toBe('0')
  })

  it('handles values with many decimal places', () => {
    expect(sumFiatTotals(['0.1', '0.2'])).toMatch(/^0\.3/)
  })
})
