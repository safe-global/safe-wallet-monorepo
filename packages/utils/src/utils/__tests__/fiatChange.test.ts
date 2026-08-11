import { getFiatChangeDirection, parseFiatChange } from '../fiatChange'

describe('parseFiatChange', () => {
  it('converts a percentage string into a decimal fraction', () => {
    expect(parseFiatChange('5.00')).toBe(0.05)
    expect(parseFiatChange('-3.00')).toBe(-0.03)
    expect(parseFiatChange('1.23456789')).toBeCloseTo(0.0123456789)
  })

  it('treats "0" as a genuine zero change', () => {
    expect(parseFiatChange('0')).toBe(0)
    expect(parseFiatChange('0.00')).toBe(0)
  })

  it('returns null when the backend has no data', () => {
    expect(parseFiatChange(null)).toBeNull()
    expect(parseFiatChange(undefined)).toBeNull()
    expect(parseFiatChange('')).toBeNull()
  })

  it('returns null for non-numeric values instead of NaN', () => {
    expect(parseFiatChange('not-a-number')).toBeNull()
    expect(parseFiatChange('1.5abc')).toBeNull()
  })

  it('returns null for non-finite values', () => {
    expect(parseFiatChange('Infinity')).toBeNull()
    expect(parseFiatChange('-Infinity')).toBeNull()
  })
})

describe('getFiatChangeDirection', () => {
  it('maps sign to direction', () => {
    expect(getFiatChangeDirection(0.05)).toBe('up')
    expect(getFiatChangeDirection(-0.03)).toBe('down')
    expect(getFiatChangeDirection(0)).toBe('none')
  })

  it('treats negative zero as no change', () => {
    expect(getFiatChangeDirection(-0)).toBe('none')
  })
})
