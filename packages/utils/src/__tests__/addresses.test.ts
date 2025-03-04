import { checksumAddress, cleanInputValue, isChecksummedAddress, parsePrefixedAddress, sameAddress } from '../addresses'

describe('Addresses', () => {
  describe('checksumAddress', () => {
    it('should checksum lowercase addresses', () => {
      const value = checksumAddress('0x62da87ff2e2216f1858603a3db9313e178da3112')
      expect(value).toBe('0x62Da87FF2E2216F1858603A3Db9313E178da3112')
    })

    it('should return checksummed addresses as is', () => {
      const value = checksumAddress('0x62Da87FF2E2216F1858603A3Db9313E178da3112')
      expect(value).toBe('0x62Da87FF2E2216F1858603A3Db9313E178da3112')
    })

    it('should return mixed case addresses as is', () => {
      const value = checksumAddress('0x62Da87ff2E2216F1858603A3Db9313E178da3112')
      expect(value).toBe('0x62Da87ff2E2216F1858603A3Db9313E178da3112')
    })

    it('should return uppercase addresses as is', () => {
      const value = checksumAddress('0X62DA87FF2E2216F1858603A3DB9313E178DA3112')
      expect(value).toBe('0X62DA87FF2E2216F1858603A3DB9313E178DA3112')
    })

    it('should return non-addresses as is', () => {
      const value = checksumAddress('sdfgsdfg')
      expect(value).toBe('sdfgsdfg')
    })
  })

  describe('isChecksummedAddress', () => {
    it('should return true for checksummed addresses', () => {
      const value = isChecksummedAddress('0x62Da87FF2E2216F1858603A3Db9313E178da3112')
      expect(value).toBe(true)
    })

    it('should return false for lowercase addresses', () => {
      const value = isChecksummedAddress('0x62da87ff2e2216f1858603a3db9313e178da3112')
      expect(value).toBe(false)
    })

    it('should return false for mixed case addresses', () => {
      const value = isChecksummedAddress('0x62Da87ff2E2216F1858603A3Db9313E178da3112')
      expect(value).toBe(false)
    })

    it('should return false for uppercase addresses', () => {
      const value = isChecksummedAddress('0X62DA87FF2E2216F1858603A3DB9313E178DA3112')
      expect(value).toBe(false)
    })

    it('should return false for non-/invalid addresses', () => {
      const value = isChecksummedAddress('sdfgsdfg')
      expect(value).toBe(false)
    })
  })

  describe('sameAddress', () => {
    it('returns false if the first or second address is undefined', () => {
      const address = '0x62Da87FF2E2216F1858603A3Db9313E178da3112'
      expect(sameAddress(undefined, address)).toBe(false)
      expect(sameAddress(address, undefined)).toBe(false)
    })

    it('returns false if the addresses are different', () => {
      const address1 = '0x62Da87FF2E2216F1858603A3Db9313E178da3112'
      const address2 = '0x62Da87FF2E2216F1858603A3Db9313E178da3113'
      expect(sameAddress(address1, address2)).toBe(false)
    })

    it('returns true if the addresses are the same', () => {
      const address = '0x62Da87FF2E2216F1858603A3Db9313E178da3112'
      expect(sameAddress(address, address)).toBe(true)
    })
  })

  describe('parsePrefixedAddress', () => {
    it('should parse a prefixed address', () => {
      const { prefix, address } = parsePrefixedAddress('prefix:0x62Da87FF2E2216F1858603A3Db9313E178da3112')
      expect(prefix).toBe('prefix')
      expect(address).toBe('0x62Da87FF2E2216F1858603A3Db9313E178da3112')
    })

    it('should parse a non-prefixed address', () => {
      const { prefix, address } = parsePrefixedAddress('0x62Da87FF2E2216F1858603A3Db9313E178da3112')
      expect(prefix).toBeUndefined()
      expect(address).toBe('0x62Da87FF2E2216F1858603A3Db9313E178da3112')
    })

    it('should checksum addresses', () => {
      const { prefix, address } = parsePrefixedAddress('0x62da87ff2e2216f1858603a3db9313e178da3112')
      expect(prefix).toBeUndefined()
      expect(address).toBe('0x62Da87FF2E2216F1858603A3Db9313E178da3112')
    })

    it('should parse a non-addresses', () => {
      const { prefix, address } = parsePrefixedAddress('sdfgsdfg')
      expect(prefix).toBeUndefined()
      expect(address).toBe('sdfgsdfg')
    })
  })

  describe('cleanInputValue', () => {
    it('should return the address when input is a valid address without prefix', () => {
      const input = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      const output = cleanInputValue(input)

      expect(output).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    })

    it('should return the address with prefix when input has a valid prefix', () => {
      const input = 'prefix:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      const output = cleanInputValue(input)

      expect(output).toBe('prefix:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    })

    it('should return the matched address when input contains text before the match', () => {
      const input = 'some text prefix:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      const output = cleanInputValue(input)

      expect(output).toBe('prefix:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    })

    it('should return the matched address when input contains text after the match', () => {
      const input = 'prefix:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd some text'
      const output = cleanInputValue(input)

      expect(output).toBe('prefix:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    })

    it('should return the original value when input does not match the regex', () => {
      const input = 'invalid input'
      const output = cleanInputValue(input)

      expect(output).toBe('invalid input')
    })

    it('should handle prefixes with hyphens', () => {
      const input = 'uh-huh:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      const output = cleanInputValue(input)

      expect(output).toBe('uh-huh:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    })

    it('should return the address when input has uppercase letters', () => {
      const input = '0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD'
      const output = cleanInputValue(input)

      expect(output).toBe('0xABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD')
    })

    it('should return the original value when Ethereum address is invalid (too short)', () => {
      const input = '0x123'
      const output = cleanInputValue(input)

      expect(output).toBe('0x123')
    })

    it('should trim spaces and return the address when input has leading and trailing spaces', () => {
      const input = '  0xabcdefabcdefabcdefabcdefabcdefabcdefabcd  '
      const output = cleanInputValue(input)

      expect(output).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    })

    it('should return the first matched address when input contains multiple addresses', () => {
      const input = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd 0x1234567890abcdef1234567890abcdef12345678'
      const output = cleanInputValue(input)

      expect(output).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    })

    it('should return the address with numeric prefix', () => {
      const input = '12345:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      const output = cleanInputValue(input)

      expect(output).toBe('12345:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    })

    it('should return the address when prefix is missing colon', () => {
      const input = 'prefix0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      const output = cleanInputValue(input)

      expect(output).toBe('0xabcdefabcdefabcdefabcdefabcdefabcdefabcd')
    })

    it('should return the original value when prefix contains invalid characters', () => {
      const input = 'invalid!prefix:0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
      const output = cleanInputValue(input)

      expect(output).toBe(input)
    })
  })
})
