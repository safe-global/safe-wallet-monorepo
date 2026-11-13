import { _formatNumber } from '.'

describe('NumberField', () => {
  it('should trim the value', () => {
    expect(_formatNumber('  123  ')).toBe('123')
    expect(_formatNumber('  0.001  ')).toBe('0.001')
  })

  it('should remove the leading zeros', () => {
    expect(_formatNumber('000123')).toBe('123')
    expect(_formatNumber('0000.001')).toBe('0.001')
  })

  it('should replace , with .', () => {
    expect(_formatNumber('123,456')).toBe('123.456')
    expect(_formatNumber('00,3')).toBe('0.3')
    expect(_formatNumber('123,456.789')).toBe('123.456789')
  })

  it('should remove the leading .', () => {
    expect(_formatNumber('.123')).toBe('0.123')
    expect(_formatNumber('.123456')).toBe('0.123456')
    expect(_formatNumber(',123')).toBe('0.123')
  })

  it('should not be possible to enter multiple . or ,', () => {
    expect(_formatNumber('123.456.789')).toBe('123.456789')
    expect(_formatNumber('123.456...789')).toBe('123.456789')
    expect(_formatNumber('123,456,789')).toBe('123.456789')
    expect(_formatNumber('123,456,,,,789')).toBe('123.456789')
  })
  it('should drop the minus sign of a negative number', () => {
    expect(_formatNumber('-1')).toBe('1')
  })

  it('should not be possible to enter characters', () => {
    expect(_formatNumber('abc')).toBe('')
    expect(_formatNumber('abc123')).toBe('123')
    expect(_formatNumber('123abc')).toBe('123')
  })
})
