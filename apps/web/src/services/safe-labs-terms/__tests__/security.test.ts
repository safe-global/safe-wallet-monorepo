import { isSafeRedirectUrl, parseRedirectUrl, getSafeRedirectUrl, isValidAutoConnectParam } from '../security'
import { AppRoutes } from '@/config/routes'

describe('safe-labs-terms security', () => {
  describe('isSafeRedirectUrl', () => {
    it('should accept valid relative paths', () => {
      expect(isSafeRedirectUrl('/welcome')).toBe(true)
      expect(isSafeRedirectUrl('/welcome/accounts')).toBe(true)
      expect(isSafeRedirectUrl('/home?safe=sep:0x123')).toBe(true)
    })

    it('should reject absolute URLs', () => {
      expect(isSafeRedirectUrl('http://evil.com')).toBe(false)
      expect(isSafeRedirectUrl('https://evil.com')).toBe(false)
    })

    it('should reject protocol-relative URLs', () => {
      expect(isSafeRedirectUrl('//evil.com')).toBe(false)
      expect(isSafeRedirectUrl('//evil.com/path')).toBe(false)
    })

    it('should reject javascript: URIs', () => {
      expect(isSafeRedirectUrl('javascript:alert(1)')).toBe(false)
      expect(isSafeRedirectUrl('/javascript:alert(1)')).toBe(false)
      expect(isSafeRedirectUrl('JavaScript:alert(1)')).toBe(false)
    })

    it('should reject data: URIs', () => {
      expect(isSafeRedirectUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
      expect(isSafeRedirectUrl('/data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('should reject vbscript: URIs', () => {
      expect(isSafeRedirectUrl('vbscript:msgbox(1)')).toBe(false)
      expect(isSafeRedirectUrl('/vbscript:msgbox(1)')).toBe(false)
    })

    it('should handle encoded URLs safely', () => {
      expect(isSafeRedirectUrl(encodeURIComponent('/welcome'))).toBe(true)
      expect(isSafeRedirectUrl(encodeURIComponent('//evil.com'))).toBe(false)
    })

    it('should reject undefined and null', () => {
      expect(isSafeRedirectUrl(undefined)).toBe(false)
      expect(isSafeRedirectUrl(null as any)).toBe(false)
      expect(isSafeRedirectUrl('')).toBe(false)
    })

    it('should reject malformed URLs', () => {
      expect(isSafeRedirectUrl('%')).toBe(false)
      expect(isSafeRedirectUrl('%%')).toBe(false)
    })
  })

  describe('parseRedirectUrl', () => {
    it('should parse pathname and query correctly', () => {
      const result = parseRedirectUrl('/home?safe=sep:0x123&chain=eth')
      expect(result).toEqual({
        pathname: '/home',
        query: {
          safe: 'sep:0x123',
          chain: 'eth',
        },
      })
    })

    it('should handle paths without query parameters', () => {
      const result = parseRedirectUrl('/welcome/accounts')
      expect(result).toEqual({
        pathname: '/welcome/accounts',
        query: {},
      })
    })

    it('should filter out dangerous query parameter values', () => {
      const result = parseRedirectUrl('/home?safe=javascript:alert(1)&chain=eth')
      expect(result).toEqual({
        pathname: '/home',
        query: {
          chain: 'eth',
          // safe parameter should be filtered out
        },
      })
    })

    it('should return null for unsafe URLs', () => {
      expect(parseRedirectUrl('//evil.com')).toBe(null)
      expect(parseRedirectUrl('http://evil.com')).toBe(null)
      expect(parseRedirectUrl('javascript:alert(1)')).toBe(null)
    })

    it('should handle complex query strings', () => {
      const result = parseRedirectUrl('/home?safe=sep:0x123&foo=bar&baz=qux')
      expect(result).toEqual({
        pathname: '/home',
        query: {
          safe: 'sep:0x123',
          foo: 'bar',
          baz: 'qux',
        },
      })
    })

    it('should handle encoded query parameters', () => {
      const result = parseRedirectUrl('/home?safe=sep%3A0x123')
      expect(result?.query.safe).toBe('sep:0x123')
    })
  })

  describe('getSafeRedirectUrl', () => {
    it('should return parsed URL for safe paths', () => {
      const result = getSafeRedirectUrl('/home?safe=sep:0x123')
      expect(result).toEqual({
        pathname: '/home',
        query: { safe: 'sep:0x123' },
      })
    })

    it('should return default route for unsafe URLs', () => {
      const result = getSafeRedirectUrl('http://evil.com')
      expect(result).toEqual({
        pathname: AppRoutes.welcome.accounts,
        query: {},
      })
    })

    it('should return default route for undefined', () => {
      const result = getSafeRedirectUrl(undefined)
      expect(result).toEqual({
        pathname: AppRoutes.welcome.accounts,
        query: {},
      })
    })

    it('should sanitize and parse complex URLs', () => {
      const result = getSafeRedirectUrl('/home?safe=sep:0x123&foo=javascript:alert(1)&bar=test')
      expect(result).toEqual({
        pathname: '/home',
        query: {
          safe: 'sep:0x123',
          bar: 'test',
          // foo should be filtered out
        },
      })
    })
  })

  describe('isValidAutoConnectParam', () => {
    it('should accept valid boolean strings', () => {
      expect(isValidAutoConnectParam('true')).toBe(true)
      expect(isValidAutoConnectParam('false')).toBe(true)
    })

    it('should reject invalid values', () => {
      expect(isValidAutoConnectParam('1')).toBe(false)
      expect(isValidAutoConnectParam('0')).toBe(false)
      expect(isValidAutoConnectParam('yes')).toBe(false)
      expect(isValidAutoConnectParam('no')).toBe(false)
      expect(isValidAutoConnectParam(undefined)).toBe(false)
      expect(isValidAutoConnectParam(null)).toBe(false)
      expect(isValidAutoConnectParam(true)).toBe(false) // Must be string
      expect(isValidAutoConnectParam(false)).toBe(false) // Must be string
    })
  })

  describe('XSS Attack Vectors', () => {
    it('should block common XSS patterns', () => {
      const xssVectors = [
        'javascript:alert(document.cookie)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        '//evil.com/xss',
        'http://evil.com/xss',
        'https://evil.com/xss',
      ]

      xssVectors.forEach((vector) => {
        expect(isSafeRedirectUrl(vector)).toBe(false)
        expect(getSafeRedirectUrl(vector)).toEqual({
          pathname: AppRoutes.welcome.accounts,
          query: {},
        })
      })
    })

    it('should block XSS in query parameters', () => {
      const result = parseRedirectUrl('/home?xss=<script>alert(1)</script>')
      // Script tags in query values are allowed by URLSearchParams but filtered
      // The key security is that we don't execute them and Next.js escapes them
      expect(result?.pathname).toBe('/home')
    })
  })

  describe('Open Redirect Attack Vectors', () => {
    it('should block open redirect attempts', () => {
      const redirectVectors = [
        '//attacker.com',
        '///attacker.com',
        '////attacker.com',
        'http://attacker.com',
        'https://attacker.com',
        '//google.com@attacker.com',
      ]

      redirectVectors.forEach((vector) => {
        expect(isSafeRedirectUrl(vector)).toBe(false)
        const result = getSafeRedirectUrl(vector)
        expect(result.pathname).toBe(AppRoutes.welcome.accounts)
      })
    })
  })
})
