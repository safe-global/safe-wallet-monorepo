import Cookies from 'js-cookie'
import { setAuthCookie, getAuthCookieData, clearAuthCookie } from '../cookieStorage'

// Mock js-cookie
jest.mock('js-cookie', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
}))

describe('cookieStorage', () => {
  const mockCookiesSet = Cookies.set as jest.MockedFunction<typeof Cookies.set>
  const mockCookiesGet = Cookies.get as jest.MockedFunction<typeof Cookies.get>
  const mockCookiesRemove = Cookies.remove as jest.MockedFunction<typeof Cookies.remove>

  // Helper to properly type mock return values for Cookies.get
  const mockGetReturn = (value: string | undefined): void => {
    ;(mockCookiesGet as unknown as jest.Mock<string | undefined>).mockReturnValue(value)
  }

  const originalDateNow = Date.now
  const originalWindow = global.window

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset Date.now to real implementation
    Date.now = originalDateNow
  })

  afterEach(() => {
    // Restore window if it was modified
    if (global.window !== originalWindow) {
      global.window = originalWindow
    }
  })

  describe('setAuthCookie', () => {
    it('should set cookie with token, tokenType and expiry', () => {
      const token = 'test-token-123'
      const tokenType = 'Bearer'
      const expiresIn = 3600 // 1 hour in seconds

      setAuthCookie(token, tokenType, expiresIn)

      expect(mockCookiesSet).toHaveBeenCalledTimes(1)
      const [cookieKey, cookieValue, options] = mockCookiesSet.mock.calls[0]

      expect(cookieKey).toBe('hn_auth')
      expect(cookieValue).toBeDefined()

      const parsedValue = JSON.parse(cookieValue as string)
      expect(parsedValue.token).toBe(token)
      expect(parsedValue.tokenType).toBe(tokenType)
      expect(parsedValue.expiry).toBeGreaterThan(Date.now())
      expect(parsedValue.expiry).toBeLessThanOrEqual(Date.now() + expiresIn * 1000)

      // Check cookie options
      expect(options).toMatchObject({
        sameSite: 'lax',
        path: '/',
      })
      expect(options?.expires).toBeDefined()
    })

    it('should calculate expiry correctly', () => {
      const token = 'test-token'
      const tokenType = 'Bearer'
      const expiresIn = 600 // 10 minutes
      const now = 1000000000
      Date.now = jest.fn(() => now)

      setAuthCookie(token, tokenType, expiresIn)

      const [, cookieValue] = mockCookiesSet.mock.calls[0]
      const parsedValue = JSON.parse(cookieValue as string)
      expect(parsedValue.expiry).toBe(now + expiresIn * 1000)
      expect(parsedValue.tokenType).toBe(tokenType)
    })

    it('should set secure flag to true on HTTPS', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'https:',
        },
        writable: true,
      })

      setAuthCookie('test-token', 'Bearer', 3600)

      const [, , options] = mockCookiesSet.mock.calls[0]
      expect(options?.secure).toBe(true)
    })

    it('should set secure flag to false on HTTP', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'http:',
        },
        writable: true,
      })

      setAuthCookie('test-token', 'Bearer', 3600)

      const [, , options] = mockCookiesSet.mock.calls[0]
      expect(options?.secure).toBe(false)
    })

    it('should calculate expires correctly from seconds to days', () => {
      const expiresIn = 86400 // 1 day in seconds

      setAuthCookie('test-token', 'Bearer', expiresIn)

      const [, , options] = mockCookiesSet.mock.calls[0]
      expect(options?.expires).toBe(1) // 1 day
    })

    it('should handle SSR environment (no window)', () => {
      // Remove window to simulate SSR
      delete (global as { window?: unknown }).window

      setAuthCookie('test-token', 'Bearer', 3600)

      const [, , options] = mockCookiesSet.mock.calls[0]
      expect(options?.secure).toBe(false) // Should default to false when window is undefined
    })

    it('should handle different token types', () => {
      setAuthCookie('test-token', 'Custom', 3600)

      const [, cookieValue] = mockCookiesSet.mock.calls[0]
      const parsedValue = JSON.parse(cookieValue as string)
      expect(parsedValue.tokenType).toBe('Custom')
    })
  })

  describe('getAuthCookieData', () => {
    it('should return auth data when cookie exists and is valid', () => {
      const token = 'valid-token-123'
      const tokenType = 'Bearer'
      const expiry = Date.now() + 3600000 // 1 hour from now
      const cookieValue = JSON.stringify({ token, tokenType, expiry })

      mockGetReturn(cookieValue)

      const result = getAuthCookieData()

      expect(result).toBeDefined()
      expect(result?.token).toBe(token)
      expect(result?.tokenType).toBe(tokenType)
      expect(result?.expiry).toBe(expiry)
      expect(mockCookiesGet).toHaveBeenCalledWith('hn_auth')
    })

    it('should return undefined when cookie does not exist', () => {
      mockGetReturn(undefined)

      const result = getAuthCookieData()

      expect(result).toBeUndefined()
    })

    it('should return undefined and clear cookie when token is expired', () => {
      const token = 'expired-token'
      const tokenType = 'Bearer'
      const expiry = Date.now() - 1000 // 1 second ago
      const cookieValue = JSON.stringify({ token, tokenType, expiry })

      mockGetReturn(cookieValue)

      const result = getAuthCookieData()

      expect(result).toBeUndefined()
      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })

    it('should return undefined and clear cookie when JSON is invalid', () => {
      mockGetReturn('invalid-json{')

      const result = getAuthCookieData()

      expect(result).toBeUndefined()
      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })

    it('should return undefined when cookie value is empty string', () => {
      mockGetReturn('')

      const result = getAuthCookieData()

      expect(result).toBeUndefined()
    })

    it('should return undefined when token is exactly at expiry time', () => {
      const now = 1000000000
      Date.now = jest.fn(() => now)
      const expiry = now // Exactly at expiry
      const cookieValue = JSON.stringify({ token: 'test-token', tokenType: 'Bearer', expiry })

      mockGetReturn(cookieValue)

      const result = getAuthCookieData()

      expect(result).toBeUndefined()
      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })

    it('should return data with different token types', () => {
      const token = 'custom-token'
      const tokenType = 'Custom'
      const expiry = Date.now() + 3600000
      const cookieValue = JSON.stringify({ token, tokenType, expiry })

      mockGetReturn(cookieValue)

      const result = getAuthCookieData()

      expect(result?.tokenType).toBe(tokenType)
    })
  })

  describe('clearAuthCookie', () => {
    it('should remove cookie with correct options', () => {
      clearAuthCookie()

      expect(mockCookiesRemove).toHaveBeenCalledTimes(1)
      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })

    it('should be called when token is expired', () => {
      const expiry = Date.now() - 1000
      const cookieValue = JSON.stringify({ token: 'expired-token', tokenType: 'Bearer', expiry })

      mockGetReturn(cookieValue)

      getAuthCookieData()

      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })

    it('should be called when JSON is invalid', () => {
      mockGetReturn('invalid-json')

      getAuthCookieData()

      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })
  })

  describe('edge cases', () => {
    it('should handle cookie with missing token field', () => {
      const cookieValue = JSON.stringify({ tokenType: 'Bearer', expiry: Date.now() + 3600000 })

      mockGetReturn(cookieValue)

      const result = getAuthCookieData()

      // Function parses JSON successfully and returns object even if token is missing
      // The expiry check passes, so it returns the data object
      expect(result).toBeDefined()
      expect(result?.token).toBeUndefined()
      expect(result?.tokenType).toBe('Bearer')
    })

    it('should handle cookie with missing tokenType field', () => {
      const cookieValue = JSON.stringify({ token: 'test-token', expiry: Date.now() + 3600000 })

      mockGetReturn(cookieValue)

      // This tests backward compatibility with old cookie format (before tokenType was added)
      const result = getAuthCookieData()

      // Function parses JSON successfully and returns object even if tokenType is missing
      expect(result).toBeDefined()
      expect(result?.token).toBe('test-token')
      expect(result?.tokenType).toBeUndefined()
    })

    it('should handle cookie with missing expiry field', () => {
      const cookieValue = JSON.stringify({ token: 'test-token', tokenType: 'Bearer' })

      mockGetReturn(cookieValue)

      const result = getAuthCookieData()

      // Missing expiry: Date.now() >= undefined evaluates to false (undefined coerced to NaN)
      // So the function returns the data object, but expiry will be undefined
      expect(result).toBeDefined()
      expect(result?.token).toBe('test-token')
      expect(result?.expiry).toBeUndefined()
    })

    it('should handle cookie with null token but valid expiry', () => {
      const expiry = Date.now() + 3600000
      const cookieValue = JSON.stringify({ token: null, tokenType: 'Bearer', expiry })

      mockGetReturn(cookieValue)

      const result = getAuthCookieData()

      // TypeScript typing expects string, but runtime might handle null
      // The function should return the data object even if token is null
      expect(result).toBeDefined()
      expect(result?.token).toBeNull()
    })

    it('should handle cookie with null expiry (treated as expired)', () => {
      const cookieValue = JSON.stringify({ token: 'test-token', tokenType: 'Bearer', expiry: null })

      mockGetReturn(cookieValue)

      const result = getAuthCookieData()

      // null expiry is coerced to 0 in comparison, which is always <= Date.now(), so treated as expired
      expect(result).toBeUndefined()
      expect(mockCookiesRemove).toHaveBeenCalled()
    })

    it('should handle very large expiry values', () => {
      const token = 'test-token'
      const tokenType = 'Bearer'
      const expiry = Number.MAX_SAFE_INTEGER
      const cookieValue = JSON.stringify({ token, tokenType, expiry })

      mockGetReturn(cookieValue)

      const result = getAuthCookieData()

      expect(result).toBeDefined()
      expect(result?.token).toBe(token)
      expect(result?.tokenType).toBe(tokenType)
      expect(result?.expiry).toBe(expiry)
    })

    it('should handle zero expiry time', () => {
      const now = 1000000000
      Date.now = jest.fn(() => now)
      const expiry = 0
      const cookieValue = JSON.stringify({ token: 'test-token', tokenType: 'Bearer', expiry })

      mockGetReturn(cookieValue)

      const result = getAuthCookieData()

      // Zero expiry is always <= Date.now(), so treated as expired
      expect(result).toBeUndefined()
      expect(mockCookiesRemove).toHaveBeenCalled()
    })

    it('should handle empty tokenType', () => {
      const token = 'test-token'
      const tokenType = ''
      const expiry = Date.now() + 3600000
      const cookieValue = JSON.stringify({ token, tokenType, expiry })

      mockGetReturn(cookieValue)

      const result = getAuthCookieData()

      expect(result).toBeDefined()
      expect(result?.tokenType).toBe('')
    })
  })
})
