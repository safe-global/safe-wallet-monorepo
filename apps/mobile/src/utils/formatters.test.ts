import { customIntl, parseFormattedNumber } from './formatters' // Adjust import path as needed

describe('customIntl', () => {
  it('should format number with default parameters', () => {
    const result = customIntl(1234)
    expect(result).toBe('$1.23K')
  })

  it('should format small number without units', () => {
    const result = customIntl(999)
    expect(result).toBe('$999')
  })

  it('should format thousands with K', () => {
    const result = customIntl(1500)
    expect(result).toBe('$1.5K')
  })

  it('should format millions with M', () => {
    const result = customIntl(2500000)
    expect(result).toBe('$2.5M')
  })

  it('should format billions with B', () => {
    const result = customIntl(3500000000)
    expect(result).toBe('$3.5B')
  })

  it('should format trillions with T', () => {
    const result = customIntl(4500000000000)
    expect(result).toBe('$4.5T')
  })

  it('should handle zero correctly', () => {
    const result = customIntl(0)
    expect(result).toBe('$0')
  })
})

describe('parseFormattedNumber', () => {
  it('should parse simple number', () => {
    const result = parseFormattedNumber('123')
    expect(result).toEqual({
      symbol: '',
      integerPart: '123',
      decimalPart: '',
      suffix: '',
    })
  })

  it('should parse decimal number', () => {
    const result = parseFormattedNumber('123.45')
    expect(result).toEqual({
      symbol: '',
      integerPart: '123',
      decimalPart: '45',
      suffix: '',
    })
  })

  it('should parse number with commas', () => {
    const result = parseFormattedNumber('1,234,567')
    expect(result).toEqual({
      symbol: '',
      integerPart: '1234567',
      decimalPart: '',
      suffix: '',
    })
  })

  it('should parse number with currency symbol', () => {
    const result = parseFormattedNumber('$123.45')
    expect(result).toEqual({
      symbol: '$',
      integerPart: '123',
      decimalPart: '45',
      suffix: '',
    })
  })

  it('should parse number with suffix', () => {
    const result = parseFormattedNumber('123K')
    expect(result).toEqual({
      symbol: '',
      integerPart: '123',
      decimalPart: '',
      suffix: 'K',
    })
  })

  it('should parse number with currency symbol and suffix', () => {
    const result = parseFormattedNumber('$123.45M')
    expect(result).toEqual({
      symbol: '$',
      integerPart: '123',
      decimalPart: '45',
      suffix: 'M',
    })
  })

  it('should parse complex formatted number', () => {
    const result = parseFormattedNumber('€1,234,567.89B')
    expect(result).toEqual({
      symbol: '€',
      integerPart: '1234567',
      decimalPart: '89',
      suffix: 'B',
    })
  })

  it('should handle empty string', () => {
    const result = parseFormattedNumber('')
    expect(result).toEqual({
      symbol: '',
      integerPart: '',
      decimalPart: '',
      suffix: '',
    })
  })

  it('should handle non-matching pattern', () => {
    const result = parseFormattedNumber('abc')
    expect(result).toEqual({
      symbol: '',
      integerPart: '',
      decimalPart: '',
      suffix: '',
    })
  })

  it('should handle negative numbers with minus sign', () => {
    const result = parseFormattedNumber('-123.45')
    expect(result).toEqual({
      symbol: '-',
      integerPart: '123',
      decimalPart: '45',
      suffix: '',
    })
  })

  it('should handle negative numbers with minus sign and suffix', () => {
    const result = parseFormattedNumber('-123.45K')
    expect(result).toEqual({
      symbol: '-',
      integerPart: '123',
      decimalPart: '45',
      suffix: 'K',
    })
  })
})
