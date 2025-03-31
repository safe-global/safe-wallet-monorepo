import * as formatters from '../formatters'
import { parseEther } from 'ethers'

describe('formatters', () => {
  describe('removeTrailingZeros', () => {
    it('strips trailing 0s', () => {
      expect(formatters._removeTrailingZeros('0')).toBe('0')
      expect(formatters._removeTrailingZeros('0.000')).toBe('0')

      expect(formatters._removeTrailingZeros('10')).toBe('10')
      expect(formatters._removeTrailingZeros('100')).toBe('100')

      expect(formatters._removeTrailingZeros('0.100')).toBe('0.1')
      expect(formatters._removeTrailingZeros('0.010')).toBe('0.01')

      expect(formatters._removeTrailingZeros('1.101')).toBe('1.101')
      expect(formatters._removeTrailingZeros('1.100')).toBe('1.1')
      expect(formatters._removeTrailingZeros('1.100010')).toBe('1.10001')

      expect(formatters._removeTrailingZeros('100.11')).toBe('100.11')
      expect(formatters._removeTrailingZeros('100.10')).toBe('100.1')

      expect(
        formatters._removeTrailingZeros('1000000000000000000000000000000000000000000000000000000000000000001'),
      ).toBe('1000000000000000000000000000000000000000000000000000000000000000001')
      expect(
        formatters._removeTrailingZeros('1000000000000000000000000000000000000000000000000000000000000000001.100'),
      ).toBe('1000000000000000000000000000000000000000000000000000000000000000001.1')
    })
  })

  describe('camelCaseToSpaces', () => {
    it('should convert "safeTransferFrom" to "safe Transfer From"', () => {
      expect(formatters.camelCaseToSpaces('safeTransferFrom')).toEqual('safe Transfer From')
    })

    it('should convert "depositERC20token" to "deposit ERC20 Token"', () => {
      expect(formatters.camelCaseToSpaces('depositERC20Token')).toEqual('deposit ERC20 Token')
    })
  })

  describe('safeFormatUnits', () => {
    it('formats to gwei by default', () => {
      const result1 = formatters.safeFormatUnits('1')
      expect(result1).toBe('0.000000001')

      const result2 = formatters.safeFormatUnits('100000000')
      expect(result2).toBe('0.1')
    })
  })

  describe('shortenAddress', () => {
    it('should shorten an address', () => {
      expect(formatters.shortenAddress('0x1234567890123456789012345678901234567890')).toEqual('0x1234...7890')
    })

    it('should shorten an address with custom length', () => {
      expect(formatters.shortenAddress('0x1234567890123456789012345678901234567890', 5)).toEqual('0x12345...67890')
    })

    it('should return an empty string if passed a falsy value', () => {
      expect(formatters.shortenAddress('', 5)).toEqual('')

      // @ts-ignore - Invalid type
      expect(formatters.shortenAddress(undefined, 5)).toEqual('')

      // @ts-ignore - Invalid type
      expect(formatters.shortenAddress(null, 5)).toEqual('')
    })
  })

  describe('formatVisualAmount', () => {
    it('should format with different decimals', () => {
      expect(formatters.formatVisualAmount('123456789', 0, 10)).toEqual('123,456,789')
      expect(formatters.formatVisualAmount('123456789', 1, 10)).toEqual('12,345,678.9')
      expect(formatters.formatVisualAmount('123456789', 2, 10)).toEqual('1,234,567.89')
      expect(formatters.formatVisualAmount('123456789', 3, 10)).toEqual('123,456.789')
      expect(formatters.formatVisualAmount('123456789', 4, 10)).toEqual('12,345.6789')
      expect(formatters.formatVisualAmount('123456789', 5, 10)).toEqual('1,234.56789')
      expect(formatters.formatVisualAmount('123456789', 6, 10)).toEqual('123.456789')
      expect(formatters.formatVisualAmount('123456789', 7, 10)).toEqual('12.3456789')
      expect(formatters.formatVisualAmount('123456789', 8, 10)).toEqual('1.23456789')
      expect(formatters.formatVisualAmount('123456789', 9, 10)).toEqual('0.123456789')
    })

    it('should format with different precisions', () => {
      expect(formatters.formatVisualAmount('123456789', 6, 0)).toEqual('123')
      expect(formatters.formatVisualAmount('123456789', 6, 1)).toEqual('123.5')
      expect(formatters.formatVisualAmount('123456789', 6, 2)).toEqual('123.46')
      expect(formatters.formatVisualAmount('123456789', 6, 3)).toEqual('123.457')
      expect(formatters.formatVisualAmount('123456789', 6, 4)).toEqual('123.4568')
      expect(formatters.formatVisualAmount('123456789', 6, 5)).toEqual('123.45679')
      expect(formatters.formatVisualAmount('123456789', 6, 6)).toEqual('123.456789')
    })

    it('should format wei correctly', () => {
      expect(formatters.formatVisualAmount(parseEther('1'), 18, 18)).toEqual('1')
      expect(formatters.formatVisualAmount(parseEther('10'), 18, 18)).toEqual('10')
      expect(formatters.formatVisualAmount(parseEther('1000'), 18, 18)).toEqual('1,000')
      expect(formatters.formatVisualAmount(parseEther('0.00001'), 18, 18)).toEqual('0.00001')
      expect(formatters.formatVisualAmount('1', 18, 18)).toEqual('0.000000000000000001')
    })
  })

  describe('maybePlural', () => {
    const { maybePlural } = formatters
    it('should add an "s" for more than 1', () => {
      expect(maybePlural(2)).toEqual('s')
      expect(maybePlural(10)).toEqual('s')
      expect(maybePlural(0)).toEqual('s')
      expect(maybePlural(1)).toEqual('')
    })

    it('should work for arrays too', () => {
      expect(maybePlural(['1', '2'])).toEqual('s')
      expect(maybePlural(['1'])).toEqual('')
    })
  })
})
