import { formatBalance } from '../utils'
import { DASH } from '../constants'

describe('formatBalance', () => {
  describe('zero balance (WA-2354)', () => {
    it('renders $0 for the string "0" instead of a dash', () => {
      expect(formatBalance('0')).toBe('$0')
    })

    it('renders $0 for a fractional zero like "0.0"', () => {
      expect(formatBalance('0.0')).toBe('$0')
    })

    it('renders $0 for a tiny positive value that rounds down to 0', () => {
      // The intent of the ticket: known zero must read as zero, not "—".
      // Sub-dollar amounts also format to "$0" via toFixed(0).
      expect(formatBalance('0.49')).toBe('$0')
    })
  })

  describe('missing / unknown balance', () => {
    it('returns a dash for undefined (balance not loaded)', () => {
      expect(formatBalance(undefined)).toBe(DASH)
    })

    it('returns a dash for null', () => {
      expect(formatBalance(null)).toBe(DASH)
    })

    it('returns a dash for an empty string', () => {
      expect(formatBalance('')).toBe(DASH)
    })

    it('returns a dash for a non-numeric string (NaN)', () => {
      expect(formatBalance('abc')).toBe(DASH)
    })
  })

  describe('positive balances', () => {
    it('formats sub-thousand values as a whole-dollar string', () => {
      expect(formatBalance('1')).toBe('$1')
      expect(formatBalance('500')).toBe('$500')
      expect(formatBalance('999')).toBe('$999')
    })

    it('formats thousands with a K suffix and one decimal', () => {
      expect(formatBalance('1000')).toBe('$1.0K')
      expect(formatBalance('1500')).toBe('$1.5K')
      expect(formatBalance('999000')).toBe('$999.0K')
    })

    it('formats millions with an M suffix and one decimal', () => {
      expect(formatBalance('1000000')).toBe('$1.0M')
      expect(formatBalance('2500000')).toBe('$2.5M')
    })
  })
})
