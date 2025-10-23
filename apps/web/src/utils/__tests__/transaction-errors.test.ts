import { isUnapprovedHashError, isGuardError, getGuardErrorName, GUARD_ERROR_CODES } from '../transaction-errors'

describe('transaction-errors', () => {
  describe('isGuardError', () => {
    it('should detect guard error in message', () => {
      const error = new Error(`Transaction reverted: ${GUARD_ERROR_CODES.UNAPPROVED_HASH}`)
      expect(isGuardError(error)).toBe(true)
    })

    it('should detect guard error in reason', () => {
      const error = Object.assign(new Error('Transaction failed'), {
        reason: `Guard check failed: ${GUARD_ERROR_CODES.UNAPPROVED_HASH}`,
      })
      expect(isGuardError(error)).toBe(true)
    })

    it('should detect guard error in data', () => {
      const error = Object.assign(new Error('Transaction failed'), {
        data: GUARD_ERROR_CODES.UNAPPROVED_HASH,
      })
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

  describe('isUnapprovedHashError', () => {
    it('should detect UnapprovedHash error', () => {
      const error = new Error(`Reverted with ${GUARD_ERROR_CODES.UNAPPROVED_HASH}`)
      expect(isUnapprovedHashError(error)).toBe(true)
    })

    it('should return false for non-UnapprovedHash errors', () => {
      const error = new Error('Some other error')
      expect(isUnapprovedHashError(error)).toBe(false)
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
})
