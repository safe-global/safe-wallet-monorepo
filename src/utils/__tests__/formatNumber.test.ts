import { formatAmount } from '@/utils/formatNumber'

describe('formatAmount', () => {
  it('should remove trailing zeroes', () => {
    expect(formatAmount('0.10000')).toEqual('0.1')
    expect(formatAmount('0.100000000000')).toEqual('0.1')
  })

  it('should use maximum of 5 decimals', () => {
    expect(formatAmount('0.123456789')).toEqual('0.12346')
  })

  it('should use five decimals for numbers up until 999.99999', () => {
    expect(formatAmount('345.123456789')).toEqual('345.12346') // 9 decimals
    expect(formatAmount('999.99999')).toEqual('999.99999') // 5 decimals

    // rounds above the specified limit
    expect(formatAmount('999.999992')).toEqual('999.99999') // 6 decimals
    expect(formatAmount('999.999996')).toEqual('1,000')
  })

  it('should use four decimals for numbers between 1,000.0001 until 9,999.9999', () => {
    // rounds down past the specified precision
    expect(formatAmount(1_000.00001)).toEqual('1,000')

    expect(formatAmount(1_000.0001234)).toEqual('1,000.0001')
    expect(formatAmount(1_234.123456789)).toEqual('1,234.1235')
    expect(formatAmount(9_999.9999)).toEqual('9,999.9999')

    // rounds above the specified limit
    expect(formatAmount(9_999.99992)).toEqual('9,999.9999')
    expect(formatAmount(9_999.99996)).toEqual('10,000')
  })

  it('should use three decimals for numbers between 10,000.001 until 99,999.999', () => {
    // rounds down past the specified precision
    expect(formatAmount(10_000.00001)).toEqual('10,000')

    expect(formatAmount(10_000.001)).toEqual('10,000.001')
    expect(formatAmount(12_345.123456789)).toEqual('12,345.123')
    expect(formatAmount(99_999.999)).toEqual('99,999.999')

    // rounds above the specified limit
    expect(formatAmount(99_999.9992)).toEqual('99,999.999')
    expect(formatAmount(99_999.9996)).toEqual('100,000')
  })

  it('should use two decimals for numbers between 100,000.01 until 999,999.99', () => {
    // rounds down past the specified precision
    expect(formatAmount(100_000.00001)).toEqual('100,000')

    expect(formatAmount(100_000.01)).toEqual('100,000.01')
    expect(formatAmount(123_456.123456789)).toEqual('123,456.12')
    expect(formatAmount(999_999.99)).toEqual('999,999.99')

    // rounds above the specified limit
    expect(formatAmount(999_999.992)).toEqual('999,999.99')
    expect(formatAmount(999_999.996)).toEqual('1,000,000')
  })

  it('should use one decimal for numbers between 1,000,000.1 until 9,999,999.9', () => {
    // rounds down past the specified precision
    expect(formatAmount(1_000_000.00001)).toEqual('1,000,000')

    expect(formatAmount(1_000_000.1)).toEqual('1,000,000.1')
    expect(formatAmount(1_234_567.123456789)).toEqual('1,234,567.1')
    expect(formatAmount(9_999_999.9)).toEqual('9,999,999.9')

    // rounds above the specified limit
    expect(formatAmount(9_999_999.92)).toEqual('9,999,999.9')
    expect(formatAmount(9_999_999.96)).toEqual('10,000,000')
  })

  it('should use no decimals for numbers between 10,000,000 and 99,999,999.5', () => {
    // rounds down past the specified precision
    expect(formatAmount(10_000_000.00001)).toEqual('10,000,000')

    expect(formatAmount(10_000_000.1)).toEqual('10,000,000')
    expect(formatAmount(12_345_678.123456789)).toEqual('12,345,678')
    expect(formatAmount(99_999_999)).toEqual('99,999,999')

    // rounds above the specified limit
    expect(formatAmount(99_999_999.2)).toEqual('99,999,999')
    expect(formatAmount(99_999_999.6)).toEqual('100M')
  })

  it('should use M symbol for numbers between 100,000,000 and 999,999,500', () => {
    // rounds down past the specified precision
    expect(formatAmount(100_000_000.00001)).toEqual('100M')
    expect(formatAmount(100_000_100)).toEqual('100M')

    expect(formatAmount(100_001_000)).toEqual('100.001M')
    expect(formatAmount(123_456_789.123456789)).toEqual('123.457M')
    expect(formatAmount(999_999_000)).toEqual('999.999M')

    // rounds above the specified limit
    expect(formatAmount(999_999_499)).toEqual('999.999M')
    expect(formatAmount(999_999_500)).toEqual('1B')
  })

  it('should use B symbol for numbers between 999,999,500 and 999,999,500,000', () => {
    // rounds down past the specified precision
    expect(formatAmount(1_000_000_000.00001)).toEqual('1B')
    expect(formatAmount(1_000_100_000)).toEqual('1B')

    expect(formatAmount(1_100_000_000)).toEqual('1.1B')
    expect(formatAmount(1_234_567_898.123456789)).toEqual('1.235B')
    expect(formatAmount(100_001_000_500)).toEqual('100.001B')
    expect(formatAmount(999_999_000_000)).toEqual('999.999B')

    // rounds above the specified limit
    expect(formatAmount(999_999_499_999)).toEqual('999.999B')
    expect(formatAmount(999_999_500_000)).toEqual('1T')
  })

  it('should use T notation for numbers between 999,999,500,000 and 999,000,000,000', () => {
    // rounds down past the specified precision
    expect(formatAmount(1_000_000_000_000.00001)).toEqual('1T')
    expect(formatAmount(1_000_100_000_000)).toEqual('1T')

    expect(formatAmount(1_100_000_000_000)).toEqual('1.1T')
    expect(formatAmount(1_234_567_898_765.123456789)).toEqual('1.235T')
    expect(formatAmount(100_001_000_000_000)).toEqual('100.001T')
    expect(formatAmount(999_999_000_000_000)).toEqual('> 999T')
  })

  it('should use > 999T for numbers above 999,000,000,000,000', () => {
    expect(formatAmount(999_000_000_000_001)).toEqual('> 999T')
    expect(formatAmount(999_000_000_000_000.001)).toEqual('> 999T')
  })

  it('should use < 0.00001 for amounts smaller then 0.00001', () => {
    expect(formatAmount(0.00001)).toEqual('0.00001')
    expect(formatAmount(0.000014)).toEqual('0.00001')
    expect(formatAmount(0.000015)).toEqual('0.00002')
    expect(formatAmount(0.000001)).toEqual('< 0.00001')
    expect(formatAmount(0.000009)).toEqual('< 0.00001')
  })

  it('should use < -0.00001 or < +0.00001 when the Eucledian distance of the amount is smaller than 0.00001', () => {
    // to keep the '+' sign the amount shall be passed as a string
    expect(formatAmount('+0.000001')).toEqual('< +0.00001')
    expect(formatAmount('+0.000009')).toEqual('< +0.00001')

    // negative numbers will keep the sign either way
    expect(formatAmount(-0.000001)).toEqual('< -0.00001')
    expect(formatAmount(-0.000009)).toEqual('< -0.00001')
    expect(formatAmount('-0.000001')).toEqual('< -0.00001')
    expect(formatAmount('-0.000009')).toEqual('< -0.00001')
  })
})
