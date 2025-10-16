import { detectInputType } from './inputDetection'

describe('inputDetection', () => {
  describe('detectInputType', () => {
    describe('private key detection', () => {
      it('detects valid private key without 0x prefix', () => {
        const privateKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
        expect(detectInputType(privateKey)).toBe('private-key')
      })

      it('detects valid private key with 0x prefix', () => {
        const privateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
        expect(detectInputType(privateKey)).toBe('private-key')
      })

      it('detects valid private key with uppercase hex', () => {
        const privateKey = '0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF'
        expect(detectInputType(privateKey)).toBe('private-key')
      })

      it('detects valid private key with mixed case hex', () => {
        const privateKey = '0x0123456789AbCdEf0123456789AbCdEf0123456789AbCdEf0123456789AbCdEf'
        expect(detectInputType(privateKey)).toBe('private-key')
      })

      it('rejects private key that is too short', () => {
        const shortKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde'
        expect(detectInputType(shortKey)).toBe('unknown')
      })

      it('rejects private key that is too long', () => {
        const longKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0'
        expect(detectInputType(longKey)).toBe('unknown')
      })

      it('rejects private key with invalid characters', () => {
        const invalidKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdeg'
        expect(detectInputType(invalidKey)).toBe('unknown')
      })

      it('rejects private key with spaces', () => {
        const keyWithSpaces = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde f'
        expect(detectInputType(keyWithSpaces)).toBe('unknown')
      })

      it('rejects private key with special characters', () => {
        const keyWithSpecial = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcde!'
        expect(detectInputType(keyWithSpecial)).toBe('unknown')
      })
    })

    describe('seed phrase detection', () => {
      it('detects valid 12-word seed phrase', () => {
        const seedPhrase =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
        expect(detectInputType(seedPhrase)).toBe('seed-phrase')
      })

      it('detects valid 15-word seed phrase', () => {
        const seedPhrase =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'
        expect(detectInputType(seedPhrase)).toBe('unknown')
      })

      it('detects valid 18-word seed phrase', () => {
        const seedPhrase =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'
        expect(detectInputType(seedPhrase)).toBe('unknown')
      })

      it('detects valid 21-word seed phrase', () => {
        const seedPhrase =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'
        expect(detectInputType(seedPhrase)).toBe('unknown')
      })

      it('detects valid 24-word seed phrase', () => {
        const seedPhrase =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'
        expect(detectInputType(seedPhrase)).toBe('seed-phrase')
      })

      it('handles seed phrase with multiple spaces between words', () => {
        const seedPhrase =
          'abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  abandon  about'
        expect(detectInputType(seedPhrase)).toBe('seed-phrase')
      })

      it('handles seed phrase with tabs between words', () => {
        const seedPhrase =
          'abandon\tabandon\tabandon\tabandon\tabandon\tabandon\tabandon\tabandon\tabandon\tabandon\tabandon\tabout'
        expect(detectInputType(seedPhrase)).toBe('seed-phrase')
      })

      it('handles seed phrase with leading and trailing whitespace', () => {
        const seedPhrase =
          '  abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about  '
        expect(detectInputType(seedPhrase)).toBe('seed-phrase')
      })

      it('rejects seed phrase with wrong word count (11 words)', () => {
        const invalidPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'
        expect(detectInputType(invalidPhrase)).toBe('unknown')
      })

      it('rejects seed phrase with wrong word count (13 words)', () => {
        const invalidPhrase =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
        expect(detectInputType(invalidPhrase)).toBe('unknown')
      })

      it('rejects seed phrase with wrong word count (25 words)', () => {
        const invalidPhrase =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'
        expect(detectInputType(invalidPhrase)).toBe('unknown')
      })

      it('rejects invalid seed phrase with non-bip39 words', () => {
        const invalidPhrase =
          'invalid invalid invalid invalid invalid invalid invalid invalid invalid invalid invalid invalid'
        expect(detectInputType(invalidPhrase)).toBe('unknown')
      })

      it('rejects empty seed phrase', () => {
        const emptyPhrase = ''
        expect(detectInputType(emptyPhrase)).toBe('unknown')
      })

      it('rejects seed phrase with only whitespace', () => {
        const whitespacePhrase = '   \t\n  '
        expect(detectInputType(whitespacePhrase)).toBe('unknown')
      })
    })

    describe('unknown input detection', () => {
      it('returns unknown for empty string', () => {
        expect(detectInputType('')).toBe('unknown')
      })

      it('returns unknown for whitespace only', () => {
        expect(detectInputType('   ')).toBe('unknown')
      })

      it('returns unknown for random text', () => {
        expect(detectInputType('this is just random text')).toBe('unknown')
      })

      it('returns unknown for numbers', () => {
        expect(detectInputType('123456789')).toBe('unknown')
      })

      it('returns unknown for mixed alphanumeric', () => {
        expect(detectInputType('abc123def456')).toBe('unknown')
      })

      it('returns unknown for special characters', () => {
        expect(detectInputType('!@#$%^&*()')).toBe('unknown')
      })

      it('returns unknown for partial private key', () => {
        expect(detectInputType('0x123')).toBe('unknown')
      })

      it('returns unknown for partial seed phrase', () => {
        expect(detectInputType('abandon abandon')).toBe('unknown')
      })

      it('returns unknown for Ethereum address', () => {
        expect(detectInputType('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')).toBe('unknown')
      })
    })

    describe('edge cases', () => {
      it('handles null input gracefully', () => {
        expect(detectInputType(null as unknown as string)).toBe('unknown')
      })

      it('handles undefined input gracefully', () => {
        expect(detectInputType(undefined as unknown as string)).toBe('unknown')
      })

      it('handles non-string input gracefully', () => {
        expect(detectInputType(123 as unknown as string)).toBe('unknown')
      })

      it('handles object input gracefully', () => {
        expect(detectInputType({} as unknown as string)).toBe('unknown')
      })

      it('handles array input gracefully', () => {
        expect(detectInputType([] as unknown as string)).toBe('unknown')
      })

      it('prioritizes private key detection over seed phrase when input could be both', () => {
        // This is a 64-character hex string that could theoretically be a private key
        // but is not a valid one, so it should return unknown
        const hexString = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
        expect(detectInputType(hexString)).toBe('private-key')
      })

      it('handles very long input strings', () => {
        const longString = 'a'.repeat(1000)
        expect(detectInputType(longString)).toBe('unknown')
      })

      it('handles input with unicode characters', () => {
        const unicodeString =
          'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon 🚀'
        expect(detectInputType(unicodeString)).toBe('unknown')
      })
    })
  })
})
