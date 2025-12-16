import Cookies from 'js-cookie'
import {
  setAuthCookie,
  getAuthToken,
  getAuthExpiry,
  isAuthenticated,
  isTokenMissingOrExpired,
  clearAuthCookie,
} from '../cookieStorage'

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
    it('should set cookie with token and expiry', () => {
      const token = 'test-token-123'
      const expiresIn = 3600 // 1 hour in seconds

      setAuthCookie(token, expiresIn)

      expect(mockCookiesSet).toHaveBeenCalledTimes(1)
      const [cookieKey, cookieValue, options] = mockCookiesSet.mock.calls[0]

      expect(cookieKey).toBe('hn_auth')
      expect(cookieValue).toBeDefined()

      const parsedValue = JSON.parse(cookieValue as string)
      expect(parsedValue.token).toBe(token)
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
      const expiresIn = 600 // 10 minutes
      const now = 1000000000
      Date.now = jest.fn(() => now)

      setAuthCookie(token, expiresIn)

      const [, cookieValue] = mockCookiesSet.mock.calls[0]
      const parsedValue = JSON.parse(cookieValue as string)
      expect(parsedValue.expiry).toBe(now + expiresIn * 1000)
    })

    it('should set secure flag to true on HTTPS', () => {
      Object.defineProperty(window, 'location', {
        value: {
          protocol: 'https:',
        },
        writable: true,
      })

      setAuthCookie('test-token', 3600)

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

      setAuthCookie('test-token', 3600)

      const [, , options] = mockCookiesSet.mock.calls[0]
      expect(options?.secure).toBe(false)
    })

    it('should calculate expires correctly from seconds to days', () => {
      const expiresIn = 86400 // 1 day in seconds

      setAuthCookie('test-token', expiresIn)

      const [, , options] = mockCookiesSet.mock.calls[0]
      expect(options?.expires).toBe(1) // 1 day
    })

    it('should handle SSR environment (no window)', () => {
      // Remove window to simulate SSR
      delete (global as { window?: unknown }).window

      setAuthCookie('test-token', 3600)

      const [, , options] = mockCookiesSet.mock.calls[0]
      expect(options?.secure).toBe(false) // Should default to false when window is undefined
    })
  })

  describe('getAuthToken', () => {
    it('should return token when cookie exists and is valid', () => {
      const token = 'valid-token-123'
      const expiry = Date.now() + 3600000 // 1 hour from now
      const cookieValue = JSON.stringify({ token, expiry })

      mockGetReturn(cookieValue)

      const result = getAuthToken()

      expect(result).toBe(token)
      expect(mockCookiesGet).toHaveBeenCalledWith('hn_auth')
    })

    it('should return undefined when cookie does not exist', () => {
      mockGetReturn(undefined)

      const result = getAuthToken()

      expect(result).toBeUndefined()
    })

    it('should return undefined when token is expired', () => {
      const token = 'expired-token'
      const expiry = Date.now() - 1000 // 1 second ago
      const cookieValue = JSON.stringify({ token, expiry })

      mockGetReturn(cookieValue)

      const result = getAuthToken()

      expect(result).toBeUndefined()
      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })

    it('should return undefined and clear cookie when JSON is invalid', () => {
      mockGetReturn('invalid-json{')

      const result = getAuthToken()

      expect(result).toBeUndefined()
      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })

    it('should return undefined when cookie value is empty string', () => {
      mockGetReturn('')

      const result = getAuthToken()

      expect(result).toBeUndefined()
    })

    it('should return undefined when token is exactly at expiry time', () => {
      const now = 1000000000
      Date.now = jest.fn(() => now)
      const expiry = now // Exactly at expiry
      const cookieValue = JSON.stringify({ token: 'test-token', expiry })

      mockGetReturn(cookieValue)

      const result = getAuthToken()

      expect(result).toBeUndefined()
      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })
  })

  describe('getAuthExpiry', () => {
    it('should return expiry timestamp when cookie exists and is valid', () => {
      const token = 'valid-token'
      const expiry = Date.now() + 3600000
      const cookieValue = JSON.stringify({ token, expiry })

      mockGetReturn(cookieValue)

      const result = getAuthExpiry()

      expect(result).toBe(expiry)
    })

    it('should return undefined when cookie does not exist', () => {
      mockGetReturn(undefined)

      const result = getAuthExpiry()

      expect(result).toBeUndefined()
    })

    it('should return undefined when token is expired', () => {
      const expiry = Date.now() - 1000
      const cookieValue = JSON.stringify({ token: 'expired-token', expiry })

      mockGetReturn(cookieValue)

      const result = getAuthExpiry()

      expect(result).toBeUndefined()
      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })

    it('should return undefined when JSON is invalid', () => {
      mockGetReturn('invalid-json')

      const result = getAuthExpiry()

      expect(result).toBeUndefined()
      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })
  })

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', () => {
      const token = 'valid-token'
      const expiry = Date.now() + 3600000
      const cookieValue = JSON.stringify({ token, expiry })

      mockGetReturn(cookieValue)

      const result = isAuthenticated()

      expect(result).toBe(true)
    })

    it('should return false when cookie does not exist', () => {
      mockGetReturn(undefined)

      const result = isAuthenticated()

      expect(result).toBe(false)
    })

    it('should return false when token is expired', () => {
      const expiry = Date.now() - 1000
      const cookieValue = JSON.stringify({ token: 'expired-token', expiry })

      mockGetReturn(cookieValue)

      const result = isAuthenticated()

      expect(result).toBe(false)
    })

    it('should return false when JSON is invalid', () => {
      mockGetReturn('invalid-json')

      const result = isAuthenticated()

      expect(result).toBe(false)
    })

    it('should return false when token is null', () => {
      const expiry = Date.now() + 3600000
      const cookieValue = JSON.stringify({ token: null, expiry })

      mockGetReturn(cookieValue)

      const result = isAuthenticated()

      expect(result).toBe(false)
    })
  })

  describe('isTokenMissingOrExpired', () => {
    it('should return false when valid token exists', () => {
      const token = 'valid-token'
      const expiry = Date.now() + 3600000
      const cookieValue = JSON.stringify({ token, expiry })

      mockGetReturn(cookieValue)

      const result = isTokenMissingOrExpired()

      expect(result).toBe(false)
    })

    it('should return true when cookie does not exist', () => {
      mockGetReturn(undefined)

      const result = isTokenMissingOrExpired()

      expect(result).toBe(true)
    })

    it('should return true when token is expired', () => {
      const expiry = Date.now() - 1000
      const cookieValue = JSON.stringify({ token: 'expired-token', expiry })

      mockGetReturn(cookieValue)

      const result = isTokenMissingOrExpired()

      expect(result).toBe(true)
    })

    it('should return true when token is exactly at expiry time', () => {
      const now = 1000000000
      Date.now = jest.fn(() => now)
      const expiry = now
      const cookieValue = JSON.stringify({ token: 'test-token', expiry })

      mockGetReturn(cookieValue)

      const result = isTokenMissingOrExpired()

      expect(result).toBe(true)
    })

    it('should return true when JSON is invalid', () => {
      mockGetReturn('invalid-json')

      const result = isTokenMissingOrExpired()

      expect(result).toBe(true)
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
      const cookieValue = JSON.stringify({ token: 'expired-token', expiry })

      mockGetReturn(cookieValue)

      getAuthToken()

      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })

    it('should be called when JSON is invalid', () => {
      mockGetReturn('invalid-json')

      getAuthToken()

      expect(mockCookiesRemove).toHaveBeenCalledWith('hn_auth', { path: '/' })
    })
  })

  describe('edge cases', () => {
    it('should handle cookie with missing token field', () => {
      const cookieValue = JSON.stringify({ expiry: Date.now() + 3600000 })

      mockGetReturn(cookieValue)

      const result = getAuthToken()

      expect(result).toBeUndefined()
    })

    it('should handle cookie with missing expiry field', () => {
      const cookieValue = JSON.stringify({ token: 'test-token' })

      mockGetReturn(cookieValue)

      const result = getAuthExpiry()

      // Should not throw, but expiry check will fail
      expect(result).toBeUndefined()
    })

    it('should handle cookie with null token but valid expiry', () => {
      const expiry = Date.now() + 3600000
      const cookieValue = JSON.stringify({ token: null, expiry })

      mockGetReturn(cookieValue)

      const result = getAuthToken()

      // When token is null, data?.token returns null
      expect(result).toBeNull()
    })

    it('should handle cookie with null expiry (treated as expired)', () => {
      const cookieValue = JSON.stringify({ token: 'test-token', expiry: null })

      mockGetReturn(cookieValue)

      const result = getAuthToken()

      // null expiry is coerced to 0, which is always <= Date.now(), so treated as expired
      expect(result).toBeUndefined()
      expect(mockCookiesRemove).toHaveBeenCalled()
    })

    it('should handle very large expiry values', () => {
      const token = 'test-token'
      const expiry = Number.MAX_SAFE_INTEGER
      const cookieValue = JSON.stringify({ token, expiry })

      mockGetReturn(cookieValue)

      const result = getAuthToken()

      expect(result).toBe(token)
    })

    it('should handle zero expiry time', () => {
      const now = 1000000000
      Date.now = jest.fn(() => now)
      const expiry = 0
      const cookieValue = JSON.stringify({ token: 'test-token', expiry })

      mockGetReturn(cookieValue)

      const result = getAuthToken()

      expect(result).toBeUndefined()
      expect(mockCookiesRemove).toHaveBeenCalled()
    })
  })
})
