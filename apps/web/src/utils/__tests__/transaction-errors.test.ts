import { BaseError } from 'viem'
import {
  isGuardError,
  extractGuardErrorCode,
  getGuardErrorInfo,
  getGuardErrorName,
  isRateLimitError,
  GUARD_ERROR_CODES,
} from '../transaction-errors'
import { RpcRetryExhaustedError } from '@/utils/providers/RetryingRpcProvider'

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
    it('returns true for RpcRetryExhaustedError', () => {
      expect(isRateLimitError(new RpcRetryExhaustedError(new Error('underlying')))).toBe(true)
    })

    it('returns true for viem BaseError whose cause chain carries code -32005', () => {
      const inner = Object.assign(new BaseError('inner'), { code: -32005 })
      const outer = new BaseError('outer', { cause: inner })
      expect(isRateLimitError(outer)).toBe(true)
    })

    it('returns true for viem BaseError whose cause chain carries code -32603', () => {
      const inner = Object.assign(new BaseError('inner'), { code: -32603 })
      const outer = new BaseError('outer', { cause: inner })
      expect(isRateLimitError(outer)).toBe(true)
    })

    it('returns true for viem BaseError whose cause chain carries status 429', () => {
      const inner = Object.assign(new BaseError('inner'), { status: 429 })
      const outer = new BaseError('outer', { cause: inner })
      expect(isRateLimitError(outer)).toBe(true)
    })

    it('returns true for plain error matching the message regex', () => {
      expect(isRateLimitError(new Error('Request is being rate limited'))).toBe(true)
      expect(isRateLimitError(new Error('too many requests'))).toBe(true)
      expect(isRateLimitError(new Error('throttle exceeded'))).toBe(true)
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
