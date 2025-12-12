import { OAUTH_CALLBACK_ROUTE } from '../oauth'

describe('oauth config', () => {
  describe('HYPERNATIVE_OAUTH_CONFIG', () => {
    const originalEnv = process.env

    beforeEach(() => {
      // Clear env vars to test defaults
      jest.resetModules()
      process.env = { ...originalEnv }
      delete process.env.NEXT_PUBLIC_HYPERNATIVE_API_BASE_URL
      delete process.env.EXPO_PUBLIC_HYPERNATIVE_API_BASE_URL
      delete process.env.NEXT_PUBLIC_HYPERNATIVE_CLIENT_ID
      delete process.env.NEXT_PUBLIC_HYPERNATIVE_REDIRECT_URI
    })

    afterEach(() => {
      process.env = originalEnv
      jest.resetModules()
    })

    it('should have default authUrl', () => {
      // Re-import after clearing env vars
      const { HYPERNATIVE_OAUTH_CONFIG: config } = require('../oauth')
      // Default HYPERNATIVE_API_BASE_URL is 'https://api.hypernative.xyz'
      expect(config.authUrl).toBe('https://api.hypernative.xyz/oauth/authorize')
    })

    it('should have default clientId', () => {
      const { HYPERNATIVE_OAUTH_CONFIG: config } = require('../oauth')
      expect(config.clientId).toBe('SAFE_WALLET_WEB')
    })

    it('should have default redirectUri as empty string', () => {
      // Ensure redirectUri env var is cleared before importing
      delete process.env.NEXT_PUBLIC_HYPERNATIVE_REDIRECT_URI
      jest.resetModules()
      const { HYPERNATIVE_OAUTH_CONFIG: config } = require('../oauth')
      expect(config.redirectUri).toBe('')
    })
  })

  describe('OAUTH_CALLBACK_ROUTE', () => {
    it('should have correct callback route', () => {
      expect(OAUTH_CALLBACK_ROUTE).toBe('/hypernative/oauth-callback')
    })
  })

  describe('MOCK_AUTH_ENABLED', () => {
    const originalEnv = process.env.NEXT_PUBLIC_HN_MOCK_AUTH

    afterEach(() => {
      // Restore original env var
      if (originalEnv !== undefined) {
        process.env.NEXT_PUBLIC_HN_MOCK_AUTH = originalEnv
      } else {
        delete process.env.NEXT_PUBLIC_HN_MOCK_AUTH
      }
    })

    it('should be false when env var is not set', () => {
      // Temporarily remove the env var
      const originalValue = process.env.NEXT_PUBLIC_HN_MOCK_AUTH
      delete process.env.NEXT_PUBLIC_HN_MOCK_AUTH

      // Reset modules to re-evaluate the config
      jest.resetModules()

      // Re-import to get the new value
      const { MOCK_AUTH_ENABLED: mockAuthEnabled } = require('../oauth')
      expect(mockAuthEnabled).toBe(false)

      // Restore env var and modules for other tests
      if (originalValue !== undefined) {
        process.env.NEXT_PUBLIC_HN_MOCK_AUTH = originalValue
      }
      jest.resetModules()
    })

    it('should be true when env var is set to "true"', () => {
      // Set the env var
      const originalValue = process.env.NEXT_PUBLIC_HN_MOCK_AUTH
      process.env.NEXT_PUBLIC_HN_MOCK_AUTH = 'true'

      // Reset modules to re-evaluate the config
      jest.resetModules()

      // Re-import to get the new value
      const { MOCK_AUTH_ENABLED: mockAuthEnabled } = require('../oauth')
      expect(mockAuthEnabled).toBe(true)

      // Restore env var and modules for other tests
      if (originalValue !== undefined) {
        process.env.NEXT_PUBLIC_HN_MOCK_AUTH = originalValue
      } else {
        delete process.env.NEXT_PUBLIC_HN_MOCK_AUTH
      }
      jest.resetModules()
    })

    it('should be false when env var is set to anything other than "true"', () => {
      // Set the env var to something other than "true"
      const originalValue = process.env.NEXT_PUBLIC_HN_MOCK_AUTH
      process.env.NEXT_PUBLIC_HN_MOCK_AUTH = 'false'

      // Reset modules to re-evaluate the config
      jest.resetModules()

      // Re-import to get the new value
      const { MOCK_AUTH_ENABLED: mockAuthEnabled } = require('../oauth')
      expect(mockAuthEnabled).toBe(false)

      // Restore env var and modules for other tests
      if (originalValue !== undefined) {
        process.env.NEXT_PUBLIC_HN_MOCK_AUTH = originalValue
      } else {
        delete process.env.NEXT_PUBLIC_HN_MOCK_AUTH
      }
      jest.resetModules()
    })
  })

  describe('getRedirectUri', () => {
    const originalWindow = global.window
    const originalEnv = process.env

    beforeEach(() => {
      jest.resetModules()
      process.env = { ...originalEnv }
      delete process.env.NEXT_PUBLIC_HYPERNATIVE_REDIRECT_URI
    })

    afterEach(() => {
      // Restore window
      global.window = originalWindow
      process.env = originalEnv
      jest.resetModules()
    })

    it('should return configured redirectUri if available', () => {
      // Set env var for redirectUri
      process.env.NEXT_PUBLIC_HYPERNATIVE_REDIRECT_URI = 'https://custom-redirect.example.com/callback'
      jest.resetModules()

      const { getRedirectUri: getRedirectUriFn, HYPERNATIVE_OAUTH_CONFIG: config } = require('../oauth')
      const result = config.redirectUri || getRedirectUriFn()
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

      // Re-import to get fresh function with mocked window
      const { getRedirectUri: getRedirectUriFn } = require('../oauth')
      const result = getRedirectUriFn()
      expect(result).toBe('https://app.safe.global/hypernative/oauth-callback')
    })

    it('should return callback route as fallback for SSR', () => {
      // Remove window
      delete (global as { window?: unknown }).window

      // Re-import to get fresh function without window
      const { getRedirectUri: getRedirectUriFn } = require('../oauth')
      const result = getRedirectUriFn()
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

      // Re-import to get fresh function with mocked window
      const { getRedirectUri: getRedirectUriFn } = require('../oauth')
      const result = getRedirectUriFn()
      expect(result).toBe('http://localhost:3000/hypernative/oauth-callback')
    })
  })
})
