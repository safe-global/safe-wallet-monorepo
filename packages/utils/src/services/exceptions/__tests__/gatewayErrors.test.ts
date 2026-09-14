import {
  CGW_ERROR_FALLBACK,
  CGW_SAFE_UNAVAILABLE,
  CGW_TOO_MANY_REQUESTS,
  CGW_UNAVAILABLE_FOR_LEGAL_REASONS,
  CGW_UNPROCESSABLE_ENTITY,
  getCgwErrorCode,
  getCgwErrorMeta,
  shouldAlertOnCgwStatus,
} from '../gatewayErrors'

const ALL_USER_FACING_STRINGS = [CGW_ERROR_FALLBACK, CGW_SAFE_UNAVAILABLE]

describe('gatewayErrors', () => {
  describe('message mapping', () => {
    it.each([429, 502, 500, 503, 504, 599, 422])('maps %s to the generic gateway message', (status) => {
      expect(getCgwErrorMeta(status)?.message).toBe('Something went wrong on our end. Try again.')
    })

    it('maps 451 (banned Safe Account) to its own message', () => {
      expect(getCgwErrorMeta(CGW_UNAVAILABLE_FOR_LEGAL_REASONS)?.message).toBe('This Safe Account is not available.')
    })

    it('covers the whole 5xx range and nothing outside it', () => {
      expect(getCgwErrorMeta(500)).toBeDefined()
      expect(getCgwErrorMeta(599)).toBeDefined()
      expect(getCgwErrorMeta(499)).toBeUndefined()
      expect(getCgwErrorMeta(600)).toBeUndefined()
    })

    it('leaves 404 unmapped — deliberately out of scope', () => {
      expect(getCgwErrorMeta(404)).toBeUndefined()
    })

    it('leaves other client errors and an absent status unmapped', () => {
      expect(getCgwErrorMeta(400)).toBeUndefined()
      expect(getCgwErrorMeta(403)).toBeUndefined()
      expect(getCgwErrorMeta(undefined)).toBeUndefined()
    })
  })

  describe('internal alerting', () => {
    it('alerts on 422 only — it means we sent a malformed request', () => {
      expect(shouldAlertOnCgwStatus(CGW_UNPROCESSABLE_ENTITY)).toBe(true)
      expect(shouldAlertOnCgwStatus(CGW_TOO_MANY_REQUESTS)).toBe(false)
      expect(shouldAlertOnCgwStatus(502)).toBe(false)
      expect(shouldAlertOnCgwStatus(CGW_UNAVAILABLE_FOR_LEGAL_REASONS)).toBe(false)
      expect(shouldAlertOnCgwStatus(404)).toBe(false)
      expect(shouldAlertOnCgwStatus(undefined)).toBe(false)
    })
  })

  describe('getCgwErrorCode', () => {
    it('builds a support reference that carries the status', () => {
      expect(getCgwErrorCode(502)).toBe('CGW-502')
    })
  })

  describe('content rules (no technical strings, copy rules)', () => {
    it.each(ALL_USER_FACING_STRINGS)('"%s" contains no forbidden content', (message) => {
      expect(message).not.toMatch(/https?:\/\//i) // no provider URL
      expect(message).not.toMatch(/</) // no markup from a response body
      expect(message).not.toMatch(/request body/i) // no request body
      expect(message).not.toMatch(/@\d+\.\d+\.\d+/) // no library version
      expect(message).not.toMatch(/\b(viem|ethers|sdk|nginx|cloudflare)\b/i) // no library / provider names
      expect(message).not.toMatch(/\b[1-5]\d{2}\b/) // no HTTP status line
      expect(message).not.toMatch(/\bplease\b/i) // no "please"
      expect(message).not.toContain('!') // no exclamation mark
    })

    it('starts every message with a capital and ends it with a full stop (sentence case)', () => {
      for (const message of ALL_USER_FACING_STRINGS) {
        expect(message).toMatch(/^[A-Z][^.]*\./)
      }
    })
  })
})
