import { calculateProtocolPercentage } from '../utils/calculateProtocolPercentage'

describe('calculateProtocolPercentage', () => {
  it('returns correct percentage for typical values', () => {
    expect(calculateProtocolPercentage('500', 1000)).toBe(50)
  })

  it('returns 100 for full total', () => {
    expect(calculateProtocolPercentage('1000', 1000)).toBe(100)
  })

  it('returns 0 when total is 0', () => {
    expect(calculateProtocolPercentage('500', 0)).toBe(0)
  })

  it('rounds to nearest integer', () => {
    expect(calculateProtocolPercentage('333.33', 1000)).toBe(33)
    expect(calculateProtocolPercentage('666.66', 1000)).toBe(67)
  })

  it('handles small percentages', () => {
    expect(calculateProtocolPercentage('1', 1000)).toBe(0)
    expect(calculateProtocolPercentage('5', 1000)).toBe(1)
  })

  it('handles string with decimal values', () => {
    expect(calculateProtocolPercentage('250.50', 1000)).toBe(25)
  })

  it('handles large values', () => {
    expect(calculateProtocolPercentage('50000000', 100000000)).toBe(50)
  })

  it('returns 0 for zero protocol value', () => {
    expect(calculateProtocolPercentage('0', 1000)).toBe(0)
  })
})
