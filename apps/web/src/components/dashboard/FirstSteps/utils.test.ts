import { calculateProgress } from './utils'

describe('calculateProgress', () => {
  it('returns 0 when no items are completed', () => {
    expect(calculateProgress([false, false])).toBe(0)
  })

  it('returns 100 when all items are completed', () => {
    expect(calculateProgress([true, true])).toBe(100)
  })

  it('returns 50 when half the items are completed', () => {
    expect(calculateProgress([true, false])).toBe(50)
  })

  it('rounds to nearest integer', () => {
    // 1 of 3 = 33.333... → rounds to 33
    expect(calculateProgress([true, false, false])).toBe(33)
    // 2 of 3 = 66.666... → rounds to 67
    expect(calculateProgress([true, true, false])).toBe(67)
  })

  it('handles a single completed item', () => {
    expect(calculateProgress([true])).toBe(100)
  })

  it('handles a single incomplete item', () => {
    expect(calculateProgress([false])).toBe(0)
  })
})
