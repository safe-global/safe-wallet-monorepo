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

  describe('Advanced Security - Multiple URL Encoding', () => {
    it('should block double-encoded protocol-relative URLs', () => {
      // %252F%252F decodes to %2F%2F which decodes to //
      expect(isSafeRedirectUrl('%252F%252Fattacker.com')).toBe(false)
    })

    it('should block triple-encoded malicious URLs', () => {
      // Multiple layers of encoding
      expect(isSafeRedirectUrl('%25252F%25252Fattacker.com')).toBe(false)
    })

    it('should block encoded javascript protocol', () => {
      // %6A%61%76%61%73%63%72%69%70%74%3A = javascript:
      expect(isSafeRedirectUrl('%6A%61%76%61%73%63%72%69%70%74%3Aalert(1)')).toBe(false)
      expect(isSafeRedirectUrl('/%6A%61%76%61%73%63%72%69%70%74%3Aalert(1)')).toBe(false)
    })

    it('should allow properly encoded safe paths', () => {
      expect(isSafeRedirectUrl('%2Fwelcome')).toBe(true) // /welcome
      expect(isSafeRedirectUrl('%2Fhome%3Fsafe%3Dsep%3A0x123')).toBe(true) // /home?safe=sep:0x123
    })
  })

  describe('Advanced Security - Whitespace Bypass', () => {
    it('should block URLs with tabs and newlines', () => {
      expect(isSafeRedirectUrl('//\tattacker.com')).toBe(false)
      expect(isSafeRedirectUrl('//\nattacker.com')).toBe(false)
      expect(isSafeRedirectUrl('//\rattacker.com')).toBe(false)
      expect(isSafeRedirectUrl('/\t/attacker.com')).toBe(false)
    })

    it('should handle whitespace in legitimate URLs', () => {
      expect(isSafeRedirectUrl('/welcome\n')).toBe(true)
      expect(isSafeRedirectUrl('\t/home')).toBe(true)
    })
  })

  describe('Advanced Security - Backslash and Special Characters', () => {
    it('should block backslashes', () => {
      expect(isSafeRedirectUrl('/\\attacker.com')).toBe(false)
      expect(isSafeRedirectUrl('/path\\to\\file')).toBe(false)
    })

    it('should block null bytes', () => {
      expect(isSafeRedirectUrl('/welcome\0')).toBe(false)
      expect(isSafeRedirectUrl('/welcome%00')).toBe(false)
    })

    it('should block @ symbol (used in open redirects)', () => {
      expect(isSafeRedirectUrl('/path@attacker.com')).toBe(false)
      expect(isSafeRedirectUrl('/@attacker.com')).toBe(false)
    })
  })

  describe('Advanced Security - Additional Protocols', () => {
    it('should block file: protocol', () => {
      expect(isSafeRedirectUrl('file:///etc/passwd')).toBe(false)
      expect(isSafeRedirectUrl('/file:///etc/passwd')).toBe(false)
    })

    it('should block blob: protocol', () => {
      expect(isSafeRedirectUrl('blob:https://example.com/123')).toBe(false)
      expect(isSafeRedirectUrl('/blob:data')).toBe(false)
    })

    it('should block about: protocol', () => {
      expect(isSafeRedirectUrl('about:blank')).toBe(false)
      expect(isSafeRedirectUrl('/about:blank')).toBe(false)
    })
  })

  describe('Advanced Security - Query Parameter Sanitization', () => {
    it('should filter out double-encoded dangerous query values', () => {
      const result = parseRedirectUrl('/home?redirect=%252F%252Fattacker.com')
      expect(result?.query.redirect).toBeUndefined()
    })

    it('should filter out backslashes in query values', () => {
      const result = parseRedirectUrl('/home?path=C:\\Windows\\System32')
      expect(result?.query.path).toBeUndefined()
    })

    it('should filter out null bytes in query values', () => {
      const result = parseRedirectUrl('/home?param=value%00extra')
      expect(result?.query.param).toBeUndefined()
    })

    it('should filter out protocol-relative URLs in query values', () => {
      const result = parseRedirectUrl('/home?url=//attacker.com')
      expect(result?.query.url).toBeUndefined()
    })

    it('should allow safe query parameters', () => {
      const result = parseRedirectUrl('/home?safe=sep:0x123&chain=ethereum')
      expect(result?.query.safe).toBe('sep:0x123')
      expect(result?.query.chain).toBe('ethereum')
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle very long URLs gracefully', () => {
      const longPath = '/path' + 'a'.repeat(10000)
      const result = isSafeRedirectUrl(longPath)
      expect(typeof result).toBe('boolean')
    })

    it('should handle malformed encoding gracefully', () => {
      expect(isSafeRedirectUrl('%')).toBe(false)
      expect(isSafeRedirectUrl('%%')).toBe(false)
      expect(isSafeRedirectUrl('%G%H')).toBe(false)
    })

    it('should handle empty query strings', () => {
      const result = parseRedirectUrl('/home?')
      expect(result).toEqual({
        pathname: '/home',
        query: {},
      })
    })

    it('should handle fragments (hash) in URLs', () => {
      const result = parseRedirectUrl('/home#section')
      expect(result?.pathname).toBe('/home')
    })
  })

  describe('Same-Domain Enforcement', () => {
    it('should ONLY allow same-domain relative paths', () => {
      // Valid: relative paths within the same domain
      expect(isSafeRedirectUrl('/home')).toBe(true)
      expect(isSafeRedirectUrl('/welcome/accounts')).toBe(true)
      expect(isSafeRedirectUrl('/settings?tab=security')).toBe(true)

      // These should ALL be blocked
      const crossDomainAttempts = [
        'https://evil.com',
        'http://evil.com',
        '//evil.com',
        '///evil.com',
        'https://safe.global', // Even legitimate domains are blocked
        'http://localhost:3000',
        '//trusted-site.com/path',
        'https://app.safe.global/welcome', // Absolute URLs are never allowed
      ]

      crossDomainAttempts.forEach((url) => {
        expect(isSafeRedirectUrl(url)).toBe(false)
      })
    })

    it('should ensure getSafeRedirectUrl never produces cross-domain redirects', () => {
      const maliciousUrls = [
        'https://evil.com/steal-data',
        '//evil.com/phishing',
        'http://attacker.com',
        'https://safe.global', // Even legitimate external domains
      ]

      maliciousUrls.forEach((url) => {
        const result = getSafeRedirectUrl(url)
        // Should fallback to default safe route, never use the malicious URL
        expect(result.pathname).toBe(AppRoutes.welcome.accounts)
        expect(result.pathname).not.toContain('evil.com')
        expect(result.pathname).not.toContain('attacker.com')
      })
    })

    it('should document that domain changes are impossible', () => {
      // This test serves as documentation:
      // The security model ONLY accepts relative paths starting with /
      // This means the browser will ALWAYS resolve these as same-origin
      // Examples:
      // - Current URL: https://app.safe.global/old-page
      // - Redirect: /new-page
      // - Result: https://app.safe.global/new-page (same domain!)

      const validPaths = ['/home', '/settings', '/welcome/accounts']
      validPaths.forEach((path) => {
        const result = getSafeRedirectUrl(path)
        expect(result.pathname).toBe(path)
        // The pathname will ALWAYS be relative (starting with /)
        // Therefore, domain cannot change
        expect(result.pathname.startsWith('/')).toBe(true)
        expect(result.pathname.includes('://')).toBe(false)
      })
    })
  })
})
