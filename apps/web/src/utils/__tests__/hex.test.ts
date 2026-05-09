import { isEmptyHexData, numberToHex } from '../hex'

describe('hex utils', () => {
  describe('isEmptyHexData', () => {
    it('should return true for empty string', () => {
      expect(isEmptyHexData('')).toBe(false)
    })

    it('should return true for non-hex data', () => {
      expect(isEmptyHexData('0xGGGG')).toBe(true)
      expect(isEmptyHexData('0xZZZZ')).toBe(true)
      expect(isEmptyHexData('not a hex')).toBe(true)
    })

    it('should return false for valid hex data', () => {
      expect(isEmptyHexData('0x0')).toBe(false)
      expect(isEmptyHexData('0x00')).toBe(false)
      expect(isEmptyHexData('0x1234')).toBe(false)
      expect(isEmptyHexData('0xabcdef')).toBe(false)
      expect(isEmptyHexData('0xABCDEF')).toBe(false)
    })

    it('should handle hex without 0x prefix', () => {
      expect(isEmptyHexData('1234')).toBe(false)
      expect(isEmptyHexData('abcd')).toBe(false)
      expect(isEmptyHexData('GHIJ')).toBe(true)
    })
  })

  describe('numberToHex', () => {
    it('should convert number 0 to hex', () => {
      expect(numberToHex(0)).toBe('0x0')
    })

    it('should convert positive numbers to hex', () => {
      expect(numberToHex(1)).toBe('0x1')
      expect(numberToHex(10)).toBe('0xa')
      expect(numberToHex(15)).toBe('0xf')
      expect(numberToHex(16)).toBe('0x10')
      expect(numberToHex(255)).toBe('0xff')
      expect(numberToHex(256)).toBe('0x100')
      expect(numberToHex(1000)).toBe('0x3e8')
    })

    it('should convert large numbers to hex', () => {
      expect(numberToHex(1000000)).toBe('0xf4240')
      expect(numberToHex(Number.MAX_SAFE_INTEGER)).toBe('0x1fffffffffffff')
    })

    it('should convert bigint to hex', () => {
      expect(numberToHex(0n)).toBe('0x0')
      expect(numberToHex(1n)).toBe('0x1')
      expect(numberToHex(255n)).toBe('0xff')
      expect(numberToHex(1000000n)).toBe('0xf4240')
    })

    it('should convert very large bigint to hex', () => {
      const largeValue = BigInt('1000000000000000000') // 1 ETH in wei
      expect(numberToHex(largeValue)).toBe('0xde0b6b3a7640000')
    })

    it('should handle wei amounts (18 decimals)', () => {
      const oneEth = BigInt('1000000000000000000')
      const twoPointFiveEth = BigInt('2500000000000000000')

      expect(numberToHex(oneEth)).toBe('0xde0b6b3a7640000')
      expect(numberToHex(twoPointFiveEth)).toBe('0x22b1c8c1227a0000')
    })
  })
})
