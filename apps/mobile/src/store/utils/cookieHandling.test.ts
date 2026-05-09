import { isAuthVerifyEndpoint, parseCookies, formatCookieHeader } from './cookieHandling'

describe('isAuthVerifyEndpoint', () => {
  it('returns true for URLs containing /v1/auth/verify', () => {
    expect(isAuthVerifyEndpoint('https://example.com/v1/auth/verify')).toBe(true)
    expect(isAuthVerifyEndpoint('/v1/auth/verify')).toBe(true)
    expect(isAuthVerifyEndpoint('/v1/auth/verify?token=abc123')).toBe(true)
  })

  it('returns false for URLs not containing /v1/auth/verify', () => {
    expect(isAuthVerifyEndpoint('https://example.com/v1/auth')).toBe(false)
    expect(isAuthVerifyEndpoint('/v1/auth/verified')).toBe(false)
    expect(isAuthVerifyEndpoint('/auth/verify')).toBe(false)
    expect(isAuthVerifyEndpoint('')).toBe(false)
  })
})

describe('parseCookies', () => {
  it('parses a single cookie correctly', () => {
    const cookieString = 'sessionId=abc123'
    expect(parseCookies(cookieString)).toEqual({ sessionId: 'abc123' })
  })

  it('parses a cookie with attributes correctly', () => {
    const cookieString = 'sessionId=abc123; Path=/; HttpOnly'
    expect(parseCookies(cookieString)).toEqual({ sessionId: 'abc123' })
  })

  it('parses multiple cookies correctly', () => {
    const cookieString = 'sessionId=abc123, token=xyz456'
    expect(parseCookies(cookieString)).toEqual({
      sessionId: 'abc123',
      token: 'xyz456',
    })
  })

  it('parses multiple cookies with attributes correctly', () => {
    const cookieString = 'sessionId=abc123; Path=/; HttpOnly, token=xyz456; Secure; SameSite=Strict'
    expect(parseCookies(cookieString)).toEqual({
      sessionId: 'abc123',
      token: 'xyz456',
    })
  })

  it('returns an empty object for invalid cookies', () => {
    expect(parseCookies('')).toEqual({})
    expect(parseCookies('invalid')).toEqual({})
    expect(parseCookies('invalid=;')).toEqual({})
  })
})

describe('formatCookieHeader', () => {
  it('formats a single cookie correctly', () => {
    const cookies = { sessionId: 'abc123' }
    expect(formatCookieHeader(cookies)).toBe('sessionId=abc123')
  })

  it('formats multiple cookies correctly', () => {
    const cookies = { sessionId: 'abc123', token: 'xyz456' }
    expect(formatCookieHeader(cookies)).toBe('sessionId=abc123; token=xyz456')
  })

  it('returns empty string for empty cookie object', () => {
    expect(formatCookieHeader({})).toBe('')
  })
})

describe('Cookie Handling', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.doMock('@safe-global/store/gateway/cgwClient', () => {
      const originalModule = jest.requireActual('@safe-global/store/gateway/cgwClient')
      return {
        __esModule: true,
        ...originalModule,
        isCredentialRoute: (url: string) => {
          return url.includes('/api/')
        },
      }
    })
  })
  describe('prepareCookieHeaders', () => {
    it('adds cookies to credential routes', () => {
      const { prepareCookieHeaders } = require('./cookieHandling')

      const headers = new Headers()
      const url = 'https://example.com/api/endpoint'
      const cookieStorage = { sessionId: 'abc123', token: 'xyz456' }

      const result = prepareCookieHeaders(headers, url, cookieStorage)
      expect(result.get('Cookie')).toBe('sessionId=abc123; token=xyz456')
    })

    it('does not add cookies to non-credential routes', () => {
      const { prepareCookieHeaders } = require('./cookieHandling')

      const headers = new Headers()
      const url = 'https://example.com/public'
      const cookieStorage = { sessionId: 'abc123', token: 'xyz456' }

      const result = prepareCookieHeaders(headers, url, cookieStorage)

      expect(result.has('Cookie')).toBe(false)
    })

    it('does not add cookies to auth/verify endpoint even if it is a credential route', () => {
      const { prepareCookieHeaders } = require('./cookieHandling')

      const headers = new Headers()
      const url = 'https://example.com/api/v1/auth/verify'
      const cookieStorage = { sessionId: 'abc123', token: 'xyz456' }

      const result = prepareCookieHeaders(headers, url, cookieStorage)

      expect(result.has('Cookie')).toBe(false)
    })

    it('does not add cookies when cookie storage is empty', () => {
      const { prepareCookieHeaders } = require('./cookieHandling')

      const headers = new Headers()
      const url = 'https://example.com/api/endpoint'
      const cookieStorage = {}

      const result = prepareCookieHeaders(headers, url, cookieStorage)

      expect(result.has('Cookie')).toBe(false)
    })

    it('preserves existing headers', () => {
      const { prepareCookieHeaders } = require('./cookieHandling')

      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      headers.set('Authorization', 'Bearer token123')

      const url = 'https://example.com/api/endpoint'
      const cookieStorage = { sessionId: 'abc123' }

      const result = prepareCookieHeaders(headers, url, cookieStorage)

      expect(result.get('Content-Type')).toBe('application/json')
      expect(result.get('Authorization')).toBe('Bearer token123')
      expect(result.get('Cookie')).toBe('sessionId=abc123')
    })
  })

  describe('handleCookieResponse', () => {
    it('updates cookieStorage with cookies from credential routes', () => {
      const { handleCookieResponse } = require('./cookieHandling')

      const responseHeaders = new Headers()
      responseHeaders.set('set-cookie', 'sessionId=abc123; Path=/; HttpOnly')
      const response = { headers: responseHeaders } as Response

      const url = 'https://example.com/api/endpoint'
      const cookieStorage = {}

      const result = handleCookieResponse(response, url, cookieStorage)

      expect(result).toEqual({ sessionId: 'abc123' })
    })

    it('merges new cookies with existing ones from credential routes', () => {
      const { handleCookieResponse } = require('./cookieHandling')

      const responseHeaders = new Headers()
      responseHeaders.set('set-cookie', 'token=xyz456; Path=/; HttpOnly')
      const response = { headers: responseHeaders } as Response

      const url = 'https://example.com/api/endpoint'
      const cookieStorage = { sessionId: 'abc123' }

      const result = handleCookieResponse(response, url, cookieStorage)

      expect(result).toEqual({ sessionId: 'abc123', token: 'xyz456' })
    })

    it('updates existing cookies with new values from credential routes', () => {
      const { handleCookieResponse } = require('./cookieHandling')

      const responseHeaders = new Headers()
      responseHeaders.set('set-cookie', 'sessionId=newvalue; Path=/; HttpOnly')
      const response = { headers: responseHeaders } as Response

      const url = 'https://example.com/api/endpoint'
      const cookieStorage = { sessionId: 'oldvalue', token: 'xyz456' }

      const result = handleCookieResponse(response, url, cookieStorage)

      expect(result).toEqual({ sessionId: 'newvalue', token: 'xyz456' })
    })

    it('does not update cookieStorage from non-credential routes', () => {
      const { handleCookieResponse } = require('./cookieHandling')

      const responseHeaders = new Headers()
      responseHeaders.set('set-cookie', 'sessionId=abc123; Path=/; HttpOnly')
      const response = { headers: responseHeaders } as Response

      const url = 'https://example.com/public'
      const cookieStorage = { token: 'xyz456' }

      const result = handleCookieResponse(response, url, cookieStorage)

      expect(result).toEqual({ token: 'xyz456' })
    })

    it('handles responses without set-cookie headers', () => {
      const { handleCookieResponse } = require('./cookieHandling')

      const responseHeaders = new Headers()
      const response = { headers: responseHeaders } as Response

      const url = 'https://example.com/api/endpoint'
      const cookieStorage = { sessionId: 'abc123', token: 'xyz456' }

      const result = handleCookieResponse(response, url, cookieStorage)

      expect(result).toEqual({ sessionId: 'abc123', token: 'xyz456' })
    })

    it('works with multiple cookies in set-cookie header', () => {
      const { handleCookieResponse } = require('./cookieHandling')

      const responseHeaders = new Headers()
      responseHeaders.set('set-cookie', 'sessionId=abc123; Path=/; HttpOnly, token=xyz456; Secure; SameSite=Strict')
      const response = { headers: responseHeaders } as Response

      const url = 'https://example.com/api/endpoint'
      const cookieStorage = {}

      const result = handleCookieResponse(response, url, cookieStorage)

      expect(result).toEqual({ sessionId: 'abc123', token: 'xyz456' })
    })

    it('handles empty cookieStorage correctly', () => {
      const { handleCookieResponse } = require('./cookieHandling')

      const responseHeaders = new Headers()
      responseHeaders.set('set-cookie', 'sessionId=abc123; Path=/; HttpOnly')
      const response = { headers: responseHeaders } as Response

      const url = 'https://example.com/api/endpoint'
      const cookieStorage = {}

      const result = handleCookieResponse(response, url, cookieStorage)

      expect(result).toEqual({ sessionId: 'abc123' })
    })
  })
})
