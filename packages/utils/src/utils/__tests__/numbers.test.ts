import { toDecimalString } from '../numbers'

describe('numbers utils', () => {
  describe('toDecimalString', () => {
    it('returns string values unchanged', () => {
      expect(toDecimalString('123')).toBe('123')
    })

    it('converts bigint values to decimal strings', () => {
      expect(toDecimalString(10n)).toBe('10')
    })

    it('converts number values to decimal strings', () => {
      expect(toDecimalString(42)).toBe('42')
    })

    it('converts objects that implement toString', () => {
      const value = {
        toString: () => '256',
      }

      expect(toDecimalString(value)).toBe('256')
    })

    it('returns 0 when toString throws', () => {
      const value = {
        toString: () => {
          throw new Error('fail')
        },
      }

      expect(toDecimalString(value)).toBe('0')
    })

    it('returns 0 for unsupported types', () => {
      expect(toDecimalString(undefined)).toBe('0')
      expect(toDecimalString(null)).toBe('0')
    })
  })
})
