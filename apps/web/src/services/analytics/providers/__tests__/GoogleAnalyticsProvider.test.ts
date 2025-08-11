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

jest.mock('../../gtm', () => ({
  gtmSetChainId: jest.fn(),
  gtmSetDeviceType: jest.fn(),
  gtmSetSafeAddress: jest.fn(),
  gtmSetUserProperty: jest.fn(),
  gtmTrackPageview: jest.fn(),
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
    it('should implement BaseProvider interface correctly', () => {
      expect(provider.id).toBe('ga')
      expect(typeof provider.isEnabled).toBe('function')
      expect(typeof provider.setEnabled).toBe('function')
      expect(typeof provider.track).toBe('function')
    })

    it('should implement IdentifyCapable interface', () => {
      expect(typeof provider.identify).toBe('function')
    })

    it('should implement PageCapable interface', () => {
      expect(typeof provider.page).toBe('function')
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
    it('should initialize with default options', () => {
      const defaultProvider = new GoogleAnalyticsProvider()
      expect(defaultProvider.id).toBe('ga')
    })

    it('should configure gtag on init', () => {
      provider.init()

      expect(mockGtag).toHaveBeenCalledWith('config', 'GA-TEST-123', {
        send_page_view: false,
        debug_mode: true,
      })
    })

    it('should identify user if userId provided in default context', () => {
      const identifySpy = jest.spyOn(provider, 'identify')

      provider.init({
        defaultContext: {
          userId: 'user-123',
        },
      })

      expect(identifySpy).toHaveBeenCalledWith('user-123')
    })

    it('should warn if gtag is not available', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const providerWithoutGtag = new GoogleAnalyticsProvider({ gtag: undefined })

      providerWithoutGtag.init()

      expect(consoleSpy).toHaveBeenCalledWith('[GA Provider] gtag not found. Ensure GA script is loaded.')
      consoleSpy.mockRestore()
    })
  })

  describe('User Identification', () => {
    beforeEach(() => {
      provider.init()
    })

    it('should identify user with ID only', () => {
      provider.identify('user-123')

      expect(mockGtag).toHaveBeenCalledWith('config', 'GA-TEST-123', {
        user_id: 'user-123',
        send_page_view: false,
      })
    })

    it('should identify user with traits', () => {
      const gtmSetUserProperty = require('../../gtm').gtmSetUserProperty

      provider.identify('user-123', {
        plan: 'premium',
        signupDate: '2025-01-11',
      })

      expect(gtmSetUserProperty).toHaveBeenCalledWith('plan', 'premium')
      expect(gtmSetUserProperty).toHaveBeenCalledWith('signupDate', '2025-01-11')
    })

    it('should not identify if disabled', () => {
      provider.setEnabled(false)
      provider.identify('user-123')

      // Should not call gtag config again after init
      expect(mockGtag).toHaveBeenCalledTimes(1) // Only the init call
    })

    it('should not identify if gtag unavailable', () => {
      const providerWithoutGtag = new GoogleAnalyticsProvider({ gtag: undefined })
      providerWithoutGtag.identify('user-123') // Should not throw
    })
  })

  describe('Page Tracking', () => {
    beforeEach(() => {
      provider.init()
    })

    it('should track page views with context', () => {
      const gtmTrackPageview = require('../../gtm').gtmTrackPageview

      provider.page({
        path: '/dashboard',
        url: 'https://app.safe.global/dashboard',
        title: 'Dashboard',
        referrer: 'https://google.com',
      })

      expect(gtmTrackPageview).toHaveBeenCalledWith('/dashboard', 'https://app.safe.global/dashboard')
    })

    it('should use current location if no context provided', () => {
      const gtmTrackPageview = require('../../gtm').gtmTrackPageview

      // Mock location
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/current-path',
          href: 'https://app.safe.global/current-path',
        },
        writable: true,
      })

      provider.page()

      expect(gtmTrackPageview).toHaveBeenCalledWith('/current-path', 'https://app.safe.global/current-path')
    })

    it('should not track if disabled', () => {
      const gtmTrackPageview = require('../../gtm').gtmTrackPageview
      provider.setEnabled(false)

      provider.page({ path: '/test' })

      expect(gtmTrackPageview).not.toHaveBeenCalled()
    })
  })

  describe('Event Tracking', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks() // Clear init calls
    })

    it('should track Safe Created events', () => {
      const event: AnalyticsEvent<'Safe Created', TestEvents['Safe Created']> = {
        name: 'Safe Created',
        payload: { network: 'ethereum', threshold: 2 },
        context: { chainId: '1' },
        timestamp: Date.now(),
      }

      provider.track(event)

      expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'safe_created', {
        event: 'safe_created',
        category: 'safe',
        action: 'safe created',
        label: undefined,
        chainId: '1',
        appVersion: expect.any(String),
        deviceType: 'desktop',
        safeAddress: '',
        send_to: 'GA-TEST-123',
      })
    })

    it('should track Transaction events', () => {
      const event: AnalyticsEvent<'Transaction Confirmed', TestEvents['Transaction Confirmed']> = {
        name: 'Transaction Confirmed',
        payload: { txHash: '0x123', value: 100 },
        context: { chainId: '137' },
      }

      provider.track(event)

      expect(mockSendGAEvent).toHaveBeenCalledWith(
        'event',
        'tx_confirmed',
        expect.objectContaining({
          event: 'tx_confirmed',
          category: 'transaction',
          action: 'transaction confirmed',
          chainId: '137',
        }),
      )
    })

    it('should track Wallet Connected events', () => {
      const event: AnalyticsEvent<'Wallet Connected', TestEvents['Wallet Connected']> = {
        name: 'Wallet Connected',
        payload: { walletType: 'metamask', address: '0xabc123' },
      }

      provider.track(event)

      expect(mockSendGAEvent).toHaveBeenCalledWith(
        'event',
        'wallet_connected',
        expect.objectContaining({
          event: 'wallet_connected',
          category: 'wallet',
          action: 'wallet connected',
        }),
      )
    })

    it('should track Safe App events', () => {
      const event: AnalyticsEvent<'Safe App Launched', TestEvents['Safe App Launched']> = {
        name: 'Safe App Launched',
        payload: { appName: 'Transaction Builder', version: '1.0.0' },
      }

      provider.track(event)

      expect(mockSendGAEvent).toHaveBeenCalledWith(
        'event',
        'safeApp',
        expect.objectContaining({
          event: 'safeApp',
          category: 'safe',
          action: 'safe app launched',
        }),
      )
    })

    it('should handle custom events with fallback categorization', () => {
      const event: AnalyticsEvent<'Custom Event', TestEvents['Custom Event']> = {
        name: 'Custom Event',
        payload: { customField: 'test-value' },
      }

      provider.track(event)

      expect(mockSendGAEvent).toHaveBeenCalledWith(
        'event',
        'customClick',
        expect.objectContaining({
          event: 'customClick',
          category: 'custom',
          action: 'custom event',
        }),
      )
    })

    it('should extract labels from payload', () => {
      const event: AnalyticsEvent<'Custom Event', TestEvents['Custom Event'] & { label: string }> = {
        name: 'Custom Event',
        payload: { customField: 'test', label: 'extracted-label' },
      }

      provider.track(event)

      expect(mockSendGAEvent).toHaveBeenCalledWith(
        'event',
        'customClick',
        expect.objectContaining({
          label: 'extracted-label',
        }),
      )
    })

    it('should include Safe address from context', () => {
      const event: AnalyticsEvent<'Custom Event', TestEvents['Custom Event']> = {
        name: 'Custom Event',
        payload: { customField: 'test' },
        context: { safeAddress: '0x1234567890abcdef' },
      }

      provider.track(event)

      expect(mockSendGAEvent).toHaveBeenCalledWith(
        'event',
        'customClick',
        expect.objectContaining({
          safeAddress: '1234567890abcdef', // 0x prefix removed
        }),
      )
    })

    it('should not track if disabled', () => {
      provider.setEnabled(false)

      const event: AnalyticsEvent<'Custom Event', TestEvents['Custom Event']> = {
        name: 'Custom Event',
        payload: { customField: 'test' },
      }

      provider.track(event)

      expect(mockSendGAEvent).not.toHaveBeenCalled()
    })

    it('should throw error on tracking failure for retry handling', () => {
      mockSendGAEvent.mockImplementation(() => {
        throw new Error('GA tracking failed')
      })

      const event: AnalyticsEvent<'Custom Event', TestEvents['Custom Event']> = {
        name: 'Custom Event',
        payload: { customField: 'test' },
      }

      expect(() => provider.track(event)).toThrow('GA tracking failed')
    })
  })

  describe('Context Updates', () => {
    beforeEach(() => {
      provider.init()
    })

    it('should update chain ID', () => {
      const gtmSetChainId = require('../../gtm').gtmSetChainId

      provider.updateContext({ chainId: '42' })

      expect(gtmSetChainId).toHaveBeenCalledWith('42')
    })

    it('should update device type', () => {
      const gtmSetDeviceType = require('../../gtm').gtmSetDeviceType

      provider.updateContext({ deviceType: 'mobile' as any })

      expect(gtmSetDeviceType).toHaveBeenCalledWith('mobile')
    })

    it('should update Safe address', () => {
      const gtmSetSafeAddress = require('../../gtm').gtmSetSafeAddress

      provider.updateContext({ safeAddress: '0x123abc' })

      expect(gtmSetSafeAddress).toHaveBeenCalledWith('0x123abc')
    })
  })

  describe('Lifecycle Methods', () => {
    it('should flush without error', async () => {
      await expect(provider.flush()).resolves.toBeUndefined()
    })

    it('should shutdown cleanly', () => {
      provider.shutdown()
      expect(provider.isEnabled()).toBe(false)
    })
  })

  describe('Event Name Mapping', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
      mockSendGAEvent.mockReset()
    })

    const testCases = [
      { input: 'safe_created', expected: 'safe_created' },
      { input: 'Safe Created', expected: 'safe_created' },
      { input: 'wallet_connected', expected: 'wallet_connected' },
      { input: 'Wallet Connected', expected: 'wallet_connected' },
      { input: 'tx_executed', expected: 'tx_executed' },
      { input: 'Transaction Executed', expected: 'tx_executed' },
      { input: 'Page View', expected: 'pageview' },
      { input: 'safe_app_opened', expected: 'safeApp' },
      { input: 'Safe App Opened', expected: 'safeApp' },
      { input: 'Unknown Event', expected: 'customClick' },
    ]

    testCases.forEach(({ input, expected }) => {
      it(`should map "${input}" to "${expected}"`, () => {
        const event: AnalyticsEvent = {
          name: input,
          payload: {},
        }

        provider.track(event)

        expect(mockSendGAEvent).toHaveBeenCalledWith('event', expected, expect.any(Object))
      })
    })
  })

  describe('Category Extraction', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
      mockSendGAEvent.mockReset()
    })

    const categoryCases = [
      { input: 'Safe App Launched', expected: 'safe' },
      { input: 'Wallet Connected', expected: 'wallet' },
      { input: 'Transaction Confirmed', expected: 'transaction' },
      { input: 'Safe Created', expected: 'safe' },
      { input: 'Custom Button Clicked', expected: 'custom' },
      { input: 'unknown_event', expected: 'unknown' },
    ]

    categoryCases.forEach(({ input, expected }) => {
      it(`should extract category "${expected}" from "${input}"`, () => {
        const event: AnalyticsEvent = {
          name: input,
          payload: {},
        }

        provider.track(event)

        expect(mockSendGAEvent).toHaveBeenCalledWith(
          'event',
          expect.any(String),
          expect.objectContaining({ category: expected }),
        )
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      provider.init()
    })

    it('should handle missing gtag gracefully in tracking', () => {
      const providerWithoutGtag = new GoogleAnalyticsProvider({ gtag: undefined })

      const event: AnalyticsEvent<'Custom Event', TestEvents['Custom Event']> = {
        name: 'Custom Event',
        payload: { customField: 'test' },
      }

      // Should not throw
      expect(() => providerWithoutGtag.track(event)).not.toThrow()
    })

    it('should log debug information when enabled', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()

      provider.identify('user-123')

      expect(consoleSpy).toHaveBeenCalledWith('[GA Provider] User identified:', {
        userId: 'user-123',
        traits: undefined,
      })

      consoleSpy.mockRestore()
    })
  })
})
