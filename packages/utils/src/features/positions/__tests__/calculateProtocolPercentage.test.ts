import { calculateProtocolPercentage } from '../utils/calculateProtocolPercentage'

describe('calculateProtocolPercentage', () => {
  it('returns correct ratio for typical values', () => {
    expect(calculateProtocolPercentage('500', 1000)).toBe(0.5)
  })

  it('returns 1 for full total', () => {
    expect(calculateProtocolPercentage('1000', 1000)).toBe(1)
  })

  it('returns 0 when total is 0', () => {
    expect(calculateProtocolPercentage('500', 0)).toBe(0)
  })

  it('returns decimal ratio', () => {
    expect(calculateProtocolPercentage('333.33', 1000)).toBeCloseTo(0.33333)
    expect(calculateProtocolPercentage('666.66', 1000)).toBeCloseTo(0.66666)
  })

  it('handles small percentages', () => {
    expect(calculateProtocolPercentage('1', 1000)).toBe(0.001)
    expect(calculateProtocolPercentage('5', 1000)).toBe(0.005)
  })

  it('handles string with decimal values', () => {
    expect(calculateProtocolPercentage('250.50', 1000)).toBe(0.2505)
  })

  it('handles large values', () => {
    expect(calculateProtocolPercentage('50000000', 100000000)).toBe(0.5)
  })

  it('returns 0 for zero protocol value', () => {
    expect(calculateProtocolPercentage('0', 1000)).toBe(0)
  })
})
