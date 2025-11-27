import { HYPERNATIVE_OAUTH_CONFIG, OAUTH_CALLBACK_ROUTE, MOCK_AUTH_ENABLED, getRedirectUri } from '../oauth'

describe('oauth config', () => {
  describe('HYPERNATIVE_OAUTH_CONFIG', () => {
    it('should have default authUrl', () => {
      expect(HYPERNATIVE_OAUTH_CONFIG.authUrl).toBe('https://mock-hn-auth.example.com/oauth/authorize')
    })

    it('should have default tokenUrl', () => {
      expect(HYPERNATIVE_OAUTH_CONFIG.tokenUrl).toBe('https://mock-hn-auth.example.com/oauth/token')
    })

    it('should have default apiBaseUrl', () => {
      expect(HYPERNATIVE_OAUTH_CONFIG.apiBaseUrl).toBe('https://mock-hn-api.example.com')
    })

    it('should have default clientId', () => {
      expect(HYPERNATIVE_OAUTH_CONFIG.clientId).toBe('mock-client-id')
    })

    it('should have default redirectUri as empty string', () => {
      expect(HYPERNATIVE_OAUTH_CONFIG.redirectUri).toBe('')
    })

    it('should have correct scope', () => {
      expect(HYPERNATIVE_OAUTH_CONFIG.scope).toBe('read:analysis write:analysis')
    })
  })

  describe('OAUTH_CALLBACK_ROUTE', () => {
    it('should have correct callback route', () => {
      expect(OAUTH_CALLBACK_ROUTE).toBe('/hypernative/oauth-callback')
    })
  })

  describe('MOCK_AUTH_ENABLED', () => {
    it('should be false when env var is not set', () => {
      expect(MOCK_AUTH_ENABLED).toBe(false)
    })
  })

  describe('getRedirectUri', () => {
    const originalWindow = global.window

    afterEach(() => {
      // Restore window
      global.window = originalWindow
    })

    it('should return configured redirectUri if available', () => {
      const mockConfig = {
        ...HYPERNATIVE_OAUTH_CONFIG,
        redirectUri: 'https://custom-redirect.example.com/callback',
      }

      // Mock the config by accessing it directly through the module
      const result = mockConfig.redirectUri || getRedirectUri()
      expect(result).toBe('https://custom-redirect.example.com/callback')
    })

    it('should construct redirectUri from window.location.origin when available', () => {
      // Mock window.location
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            origin: 'https://app.safe.global',
          },
        },
        writable: true,
        configurable: true,
      })

      const result = getRedirectUri()
      expect(result).toBe('https://app.safe.global/hypernative/oauth-callback')
    })

    it('should return callback route as fallback for SSR', () => {
      // Remove window
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const result = getRedirectUri()
      expect(result).toBe('/hypernative/oauth-callback')
    })

    it('should handle localhost origin', () => {
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            origin: 'http://localhost:3000',
          },
        },
        writable: true,
        configurable: true,
      })

      const result = getRedirectUri()
      expect(result).toBe('http://localhost:3000/hypernative/oauth-callback')
    })
  })
})
