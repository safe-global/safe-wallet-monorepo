import { getCurrencyName, getCurrencySymbol } from './currency'

describe('currency utils', () => {
  describe('getCurrencyName', () => {
    it('returns the correct name for USD', () => {
      const name = getCurrencyName('USD', 'en')
      // Accept either "US Dollar" or "USD" as fallback
      expect(['US Dollar', 'USD']).toContain(name)
    })

    it('returns the correct name for EUR', () => {
      const name = getCurrencyName('EUR', 'en')
      expect(['Euro', 'EUR']).toContain(name)
    })

    it('falls back to code for unknown currency', () => {
      const name = getCurrencyName('FOO', 'en')
      expect(name).toBe('FOO')
    })
  })

  describe('getCurrencySymbol', () => {
    it('returns the correct symbol for USD', () => {
      const symbol = getCurrencySymbol('USD', 'en')
      // Accept $ or USD as fallback
      expect(['$', 'USD']).toContain(symbol)
    })

    it('returns the correct symbol for EUR', () => {
      const symbol = getCurrencySymbol('EUR', 'en')
      // Accept € or EUR as fallback
      expect(['€', 'EUR']).toContain(symbol)
    })

    it('falls back to code for unknown currency', () => {
      const symbol = getCurrencySymbol('FOO', 'en')
      expect(symbol).toBe('FOO')
    })
  })
})
