import { BaseError } from 'viem'
import {
  isGuardError,
  extractGuardErrorCode,
  getGuardErrorInfo,
  getGuardErrorName,
  isRateLimitError,
  GUARD_ERROR_CODES,
} from '../transaction-errors'

describe('transaction-errors', () => {
  describe('isGuardError', () => {
    it('should detect guard error in message', () => {
      const error = new Error(`Transaction reverted: ${GUARD_ERROR_CODES.UNAPPROVED_HASH}`)
      expect(isGuardError(error)).toBe(true)
    })

    it('should detect guard error code in sanitized error message', () => {
      // This simulates what happens after asError() sanitization
      const error = new Error(`execution reverted: ${GUARD_ERROR_CODES.UNAPPROVED_HASH}`)
      expect(isGuardError(error)).toBe(true)
    })

    it('should return false for non-guard errors', () => {
      const error = new Error('Regular error')
      expect(isGuardError(error)).toBe(false)
    })

    it('should return false for null/undefined', () => {
      expect(isGuardError(null as any)).toBe(false)
      expect(isGuardError(undefined as any)).toBe(false)
    })
  })

  describe('extractGuardErrorCode', () => {
    it('should extract guard error code from message', () => {
      const error = new Error(`Transaction reverted: ${GUARD_ERROR_CODES.UNAPPROVED_HASH}`)
      expect(extractGuardErrorCode(error)).toBe(GUARD_ERROR_CODES.UNAPPROVED_HASH)
    })

    it('should return undefined for non-guard errors', () => {
      const error = new Error('Regular error')
      expect(extractGuardErrorCode(error)).toBeUndefined()
    })

    it('should return undefined for null/undefined', () => {
      expect(extractGuardErrorCode(null as any)).toBeUndefined()
      expect(extractGuardErrorCode(undefined as any)).toBeUndefined()
    })
  })

  describe('getGuardErrorInfo', () => {
    it('should return error name for guard error', () => {
      const error = new Error(`Transaction reverted: ${GUARD_ERROR_CODES.UNAPPROVED_HASH}`)
      expect(getGuardErrorInfo(error)).toBe('UnapprovedHash')
    })

    it('should return undefined for non-guard errors', () => {
      const error = new Error('Regular error')
      expect(getGuardErrorInfo(error)).toBeUndefined()
    })

    it('should return undefined for null/undefined', () => {
      expect(getGuardErrorInfo(null as any)).toBeUndefined()
      expect(getGuardErrorInfo(undefined as any)).toBeUndefined()
    })
  })

  describe('getGuardErrorName', () => {
    it('should return correct name for UnapprovedHash', () => {
      expect(getGuardErrorName(GUARD_ERROR_CODES.UNAPPROVED_HASH)).toBe('UnapprovedHash')
    })

    it('should return "Unknown" for unrecognized codes', () => {
      expect(getGuardErrorName('0x12345678')).toBe('Unknown')
    })
  })

  describe('isRateLimitError', () => {
    it.each([
      { label: 'code -32005', extra: { code: -32005 } },
      { label: 'status 429', extra: { status: 429 } },
    ])('returns true for viem BaseError whose cause chain carries $label', ({ extra }) => {
      const inner = Object.assign(new BaseError('inner'), extra)
      const outer = new BaseError('outer', { cause: inner })
      expect(isRateLimitError(outer)).toBe(true)
    })

    it('returns false for viem BaseError carrying code -32603 (internal error, not throttle)', () => {
      // -32603 is intentionally NOT matched. A real eth_call simulation failure
      // can surface as -32603 and must not be silently translated to "Network
      // is busy" — that would prompt users to retry guaranteed-failing txs.
      const inner = Object.assign(new BaseError('inner'), { code: -32603 })
      const outer = new BaseError('outer', { cause: inner })
      expect(isRateLimitError(outer)).toBe(false)
    })

    it('returns false for contract reverts whose message mentions "rate limit"', () => {
      // Guard against the previous regex-fallback false positive: a contract
      // revert string containing "rate limit" must NOT be classified as a
      // network-layer rate limit, or users would be told to "try again" on a
      // transaction that is guaranteed to fail on-chain.
      expect(isRateLimitError(new Error('execution reverted: rate limit exceeded'))).toBe(false)
      expect(isRateLimitError(new Error('transfer throttled'))).toBe(false)
    })

    it('returns false for unrelated errors', () => {
      expect(isRateLimitError(new Error('contract reverted: insufficient balance'))).toBe(false)
      expect(isRateLimitError(new Error('user rejected'))).toBe(false)
      expect(isRateLimitError(null)).toBe(false)
      expect(isRateLimitError(undefined)).toBe(false)
    })

    it('returns false for viem BaseError with an unrelated cause code', () => {
      const inner = Object.assign(new BaseError('inner'), { code: -32602 })
      const outer = new BaseError('outer', { cause: inner })
      expect(isRateLimitError(outer)).toBe(false)
    })
  })
})
