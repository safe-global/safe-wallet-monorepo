/**
 * Unit tests for GoogleAnalyticsProvider
 */

import { GoogleAnalyticsProvider } from '../GoogleAnalyticsProvider'
import type { AnalyticsEvent, SafeEventMap } from '../../core'
import { sendGAEvent } from '@next/third-parties/google'

// Mock external dependencies
jest.mock('@next/third-parties/google', () => ({
  sendGAEvent: jest.fn(),
}))

jest.mock('@/config/constants', () => ({
  GA_TRACKING_ID: 'GA-TEST-ID',
  IS_PRODUCTION: false,
}))

const mockSendGAEvent = sendGAEvent as jest.MockedFunction<typeof sendGAEvent>

// Test event types
type TestEvents = SafeEventMap & {
  'Safe Created': { network: string; threshold: number }
  'Transaction Confirmed': { txHash: string; value: number }
  'Wallet Connected': { walletType: string; address: string }
  'Safe App Launched': { appName: string; version: string }
  'Custom Event': { customField: string }
}

describe('GoogleAnalyticsProvider', () => {
  let provider: GoogleAnalyticsProvider<TestEvents>
  let mockGtag: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockGtag = jest.fn()

    provider = new GoogleAnalyticsProvider<TestEvents>({
      measurementId: 'GA-TEST-123',
      debugMode: true,
      gtag: mockGtag,
    })
  })

  describe('Provider Interface', () => {
    it('should have correct provider ID', () => {
      expect(provider.id).toBe('ga')
    })

    it('should be enabled by default', () => {
      expect(provider.isEnabled()).toBe(true)
    })

    it('should allow enabling/disabling', () => {
      provider.setEnabled(false)
      expect(provider.isEnabled()).toBe(false)

      provider.setEnabled(true)
      expect(provider.isEnabled()).toBe(true)
    })
  })

  describe('Initialization', () => {
    it('should initialize with gtag configuration', () => {
      provider.init()

      expect(mockGtag).toHaveBeenCalledWith('config', 'GA-TEST-123', {
        send_page_view: false,
        debug_mode: true,
      })
    })

    it('should set user ID if provided in context', () => {
      provider.init({ defaultContext: { userId: 'user-123' } })

      expect(mockGtag).toHaveBeenCalledWith('config', 'GA-TEST-123', {
        user_id: 'user-123',
        send_page_view: false,
      })
    })

    it('should handle missing gtag gracefully', () => {
      const providerWithoutGtag = new GoogleAnalyticsProvider({ gtag: undefined })

      // Should not throw
      expect(() => providerWithoutGtag.init()).not.toThrow()
    })
  })

  describe('User Identification', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
    })

    it('should identify users with sanitized user ID', () => {
      provider.identify('user-123')

      expect(mockGtag).toHaveBeenCalledWith('config', 'GA-TEST-123', {
        user_id: 'user-123',
        send_page_view: false,
      })
    })

    it('should set user properties from traits', () => {
      provider.identify('user-123', { walletType: 'metamask', chainId: '1' })

      expect(mockGtag).toHaveBeenCalledWith('set', 'user_properties', {
        wallet_type: 'metamask',
      })
      expect(mockGtag).toHaveBeenCalledWith('set', 'user_properties', {
        chain_id: '1',
      })
    })

    it('should skip identification when disabled', () => {
      provider.setEnabled(false)
      provider.identify('user-123')

      expect(mockGtag).not.toHaveBeenCalled()
    })
  })

  describe('Page Tracking', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
    })

    it('should track page views with context', () => {
      provider.page({
        path: '/dashboard',
        url: 'https://app.safe.global/dashboard',
        title: 'Safe Dashboard',
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
        page_title: 'Safe Dashboard',
        page_location: 'https://app.safe.global/dashboard',
        page_path: '/dashboard',
        send_to: 'GA-TEST-123',
      })
    })

    it('should handle page tracking without context', () => {
      // Mock location for test environment
      Object.defineProperty(global, 'location', {
        value: { pathname: '/test', href: 'https://example.com/test' },
        writable: true,
      })
      Object.defineProperty(global, 'document', {
        value: { title: 'Test Page' },
        writable: true,
      })

      provider.page()

      expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
        page_title: 'Test Page',
        page_location: 'https://example.com/test',
        page_path: '/test',
        send_to: 'GA-TEST-123',
      })
    })
  })

  describe('Event Tracking', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
      mockSendGAEvent.mockReset()
    })

    it('should track events with normalized names', () => {
      const event: AnalyticsEvent = {
        name: 'Safe Created',
        payload: { network: 'mainnet', threshold: 2 },
        context: { chainId: '1', safeAddress: '0x123' },
      }

      provider.track(event)

      expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'safe_created', {
        network: 'mainnet',
        threshold: 2,
        chain_id: '1',
        safe_address: '123',
        app_version: expect.any(String),
        send_to: 'GA-TEST-123',
      })
    })

    it('should transform camelCase properties to snake_case', () => {
      const event: AnalyticsEvent = {
        name: 'WalletConnected',
        payload: { walletType: 'metamask', transactionHash: '0xabc' },
        context: { chainId: '1' },
      }

      provider.track(event)

      expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'wallet_connected', {
        wallet_type: 'metamask',
        transaction_hash: '0xabc',
        chain_id: '1',
        app_version: expect.any(String),
        send_to: 'GA-TEST-123',
      })
    })

    it('should handle empty payload', () => {
      const event: AnalyticsEvent = {
        name: 'test_event',
        payload: {},
        context: { chainId: '1' },
      }

      provider.track(event)

      expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'test_event', {
        chain_id: '1',
        app_version: expect.any(String),
        send_to: 'GA-TEST-123',
      })
    })

    it('should skip tracking when disabled', () => {
      provider.setEnabled(false)

      const event: AnalyticsEvent = {
        name: 'test_event',
        payload: { test: 'data' },
      }

      provider.track(event)

      expect(mockSendGAEvent).not.toHaveBeenCalled()
    })

    it('should validate event names', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const event: AnalyticsEvent = {
        name: '', // Invalid empty name
        payload: { test: 'data' },
      }

      provider.track(event)

      expect(consoleSpy).toHaveBeenCalledWith('[GA Provider] Invalid event name:', '')
      expect(mockSendGAEvent).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should handle tracking errors gracefully', () => {
      mockSendGAEvent.mockImplementation(() => {
        throw new Error('GA Error')
      })

      const event: AnalyticsEvent = {
        name: 'test_event',
        payload: { test: 'data' },
      }

      expect(() => provider.track(event)).toThrow('GA Error')
    })
  })

  describe('Event Name Normalization', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
      mockSendGAEvent.mockReset()
    })

    const normalizationCases = [
      { input: 'SafeCreated', expected: 'safe_created' },
      { input: 'WalletConnected', expected: 'wallet_connected' },
      { input: 'TransactionConfirmed', expected: 'transaction_confirmed' },
      { input: 'Safe App Launched', expected: 'safe_app_launched' },
      { input: 'custom-event-name', expected: 'custom_event_name' },
      { input: 'MIXED_case-EVENT', expected: 'mixed_case_event' },
    ]

    normalizationCases.forEach(({ input, expected }) => {
      it(`should normalize "${input}" to "${expected}" for GA4`, () => {
        const event: AnalyticsEvent = {
          name: input,
          payload: { test: 'data' },
        }

        provider.track(event)

        expect(mockSendGAEvent).toHaveBeenCalledWith('event', expected, expect.any(Object))
      })
    })
  })

  describe('Lifecycle Methods', () => {
    it('should resolve flush immediately', async () => {
      await expect(provider.flush()).resolves.toBeUndefined()
    })

    it('should shutdown gracefully', async () => {
      expect(provider.isEnabled()).toBe(true)

      await provider.shutdown()

      expect(provider.isEnabled()).toBe(false)
    })
  })
})
