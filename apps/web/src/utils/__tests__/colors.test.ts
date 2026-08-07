import { getDeterministicColor } from '@/utils/colors'

describe('getDeterministicColor', () => {
  it('returns the same color for the same input', () => {
    expect(getDeterministicColor('My Space')).toBe(getDeterministicColor('My Space'))
  })

  it('returns different colors for different inputs', () => {
    const colors = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'].map(getDeterministicColor)
    expect(new Set(colors).size).toBe(colors.length)
  })

  it('returns a CSS rgb() string', () => {
    expect(getDeterministicColor('Anything')).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })

  it('handles an empty string without throwing', () => {
    expect(() => getDeterministicColor('')).not.toThrow()
  })
})
