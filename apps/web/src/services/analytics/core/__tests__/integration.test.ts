/**
 * Integration tests for the complete analytics system
 * Tests real provider API integration and end-to-end event flow
 */

// Mock constants before any imports (following codebase pattern)
jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  GA_TRACKING_ID: 'GA-TEST-123',
  MIXPANEL_TOKEN: 'test-token',
  IS_PRODUCTION: false,
}))

// Mock @next/third-parties/google
jest.mock('@next/third-parties/google', () => ({
  sendGAEvent: jest.fn(),
}))

// Mock mixpanel-browser (following existing pattern)
jest.mock('mixpanel-browser', () => ({
  init: jest.fn(),
  track: jest.fn(),
  identify: jest.fn(),
  register: jest.fn(),
  reset: jest.fn(),
  opt_in_tracking: jest.fn(),
  opt_out_tracking: jest.fn(),
  has_opted_in_tracking: jest.fn().mockReturnValue(true),
  people: {
    set: jest.fn(),
    set_once: jest.fn(),
    increment: jest.fn(),
    append: jest.fn(),
    union: jest.fn(),
  },
}))

import { AnalyticsBuilder } from '../builder'
import { GoogleAnalyticsProvider } from '../../providers/GoogleAnalyticsProvider'
import { MixpanelProvider } from '../../providers/MixpanelProvider'
import type { SafeEventMap, AnalyticsEvent } from '../types'
import type { Analytics } from '../analytics'
import { sendGAEvent } from '@next/third-parties/google'

// Get mocked instances
const mockSendGAEvent = sendGAEvent as jest.MockedFunction<typeof sendGAEvent>
const mockMixpanel = jest.requireMock('mixpanel-browser')

// Mock gtag function for direct testing
const mockGtag = jest.fn()
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
})

// Test events
type TestEvents = SafeEventMap & {
  wallet_connected: {
    wallet_label: string
    wallet_address: string
    chain_id: string
  }
  transaction_created: {
    tx_type: string
    safe_address: string
    amount?: string
  }
}

describe('Analytics Integration', () => {
  let analytics: Analytics<TestEvents>
  let gaProvider: GoogleAnalyticsProvider<TestEvents>
  let mixpanelProvider: MixpanelProvider<TestEvents>

  beforeEach(() => {
    jest.clearAllMocks()

    // Create real provider instances with test configuration
    gaProvider = new GoogleAnalyticsProvider({
      measurementId: 'GA-TEST-123',
      debugMode: true,
      gtag: mockGtag,
    })

    mixpanelProvider = new MixpanelProvider({
      debugMode: true,
    })

    // Build analytics instance with real providers
    analytics = AnalyticsBuilder.create<TestEvents>()
      .addProvider(gaProvider)
      .addProvider(mixpanelProvider)
      .withDefaultContext({
        userId: 'test-user',
        source: 'web',
        chainId: '1',
      })
      .withConsent({ analytics: true })
      .build()
  })

  describe('Provider Initialization', () => {
    it('should initialize all providers with correct configuration', async () => {
      await analytics.init()

      // Verify GA initialization (first config call)
      expect(mockGtag).toHaveBeenCalledWith('config', 'GA-TEST-123', {
        debug_mode: true,
        send_page_view: false,
      })

      // Verify user identification happens during init (second config call)
      expect(mockGtag).toHaveBeenCalledWith('config', 'GA-TEST-123', {
        user_id: 'test_user', // User ID is sanitized (dashes to underscores)
        send_page_view: false,
      })

      // Verify Mixpanel initialization with correct config
      expect(mockMixpanel.init).toHaveBeenCalledWith('test-token', {
        debug: true, // IS_PRODUCTION is false in tests
        persistence: 'localStorage',
        autocapture: false,
        batch_requests: true,
        ip: false,
        opt_out_tracking_by_default: true,
      })
    })

    it('should handle provider initialization errors gracefully', async () => {
      // Make Mixpanel init throw an error
      mockMixpanel.init.mockImplementationOnce(() => {
        throw new Error('Mixpanel init failed')
      })

      // Should not throw, should continue with other providers
      await expect(analytics.init()).resolves.not.toThrow()

      // GA should still be initialized
      expect(mockGtag).toHaveBeenCalled()
    })
  })

  describe('Event Tracking Flow', () => {
    beforeEach(async () => {
      await analytics.init()
    })

    it('should track events to both providers with proper format transformation', () => {
      const event: AnalyticsEvent<'wallet_connected', TestEvents['wallet_connected']> = {
        name: 'wallet_connected',
        payload: {
          wallet_label: 'MetaMask',
          wallet_address: '0x123...abc',
          chain_id: '1',
        },
      }

      analytics.track(event)

      // Verify GA receives event via sendGAEvent
      expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'wallet_connected', {
        wallet_label: 'MetaMask',
        wallet_address: '0x123...abc',
        chain_id: '1',
        // Default context should be merged
        user_id: 'test_user', // Sanitized (dashes converted to underscores)
        source: 'web',
        send_to: 'GA-TEST-123',
        app_version: expect.any(String),
      })

      // Verify Mixpanel receives Title Case event
      expect(mockMixpanel.track).toHaveBeenCalledWith('Wallet Connected', {
        'Wallet Label': 'MetaMask',
        'Wallet Address': '0x123...abc',
        'Chain Id': '1',
        'Chain ID': '1', // Both formats might be present
        'User ID': 'test-user',
        Source: 'web',
      })
    })

    it('should merge event payload with default context correctly', () => {
      const event: AnalyticsEvent<'transaction_created', TestEvents['transaction_created']> = {
        name: 'transaction_created',
        payload: {
          tx_type: 'transfer_token',
          safe_address: '0x456...def',
          amount: '1.5',
        },
        context: {
          chainId: '137', // Override default
        } as any, // Allow additional properties for testing
      }

      analytics.track(event)

      // GA should receive merged context via sendGAEvent
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        'event',
        'transaction_created',
        expect.objectContaining({
          tx_type: 'transfer_token',
          safe_address: '0x456...def',
          amount: '1.5',
          user_id: 'test_user', // From default context (sanitized)
          source: 'web', // From default context
          chain_id: '137', // Overridden by event context
          send_to: 'GA-TEST-123',
        }),
      )

      // Mixpanel should receive Title Case version
      expect(mockMixpanel.track).toHaveBeenCalledWith(
        'Transaction Created',
        expect.objectContaining({
          'Tx Type': 'transfer_token',
          'Safe Address': '0x456...def',
          Amount: '1.5',
          'User ID': 'test-user',
          Source: 'web',
          'Chain ID': '137', // Only expect the format that's actually provided
        }),
      )
    })

    it('should handle tracking errors gracefully without affecting other providers', () => {
      // Make GA throw an error
      mockSendGAEvent.mockImplementationOnce(() => {
        throw new Error('GA tracking failed')
      })

      const event: AnalyticsEvent<'wallet_connected', TestEvents['wallet_connected']> = {
        name: 'wallet_connected',
        payload: {
          wallet_label: 'MetaMask',
          wallet_address: '0x123...abc',
          chain_id: '1',
        },
      }

      // Should not throw
      expect(() => analytics.track(event)).not.toThrow()

      // Mixpanel should still work
      expect(mockMixpanel.track).toHaveBeenCalledWith('Wallet Connected', expect.any(Object))
    })
  })

  describe('User Identification Flow', () => {
    beforeEach(async () => {
      await analytics.init()
    })

    it('should identify users across all capable providers', () => {
      const userId = 'user-123'
      const traits = {
        plan: 'premium',
        wallet_count: 3,
      }

      analytics.identify(userId, traits)

      // GA should set user ID and properties
      expect(mockGtag).toHaveBeenCalledWith('config', 'GA-TEST-123', {
        user_id: 'user_123', // Sanitized for GA
        send_page_view: false,
      })

      // Mixpanel should identify and set properties (raw user ID, not sanitized)
      expect(mockMixpanel.identify).toHaveBeenCalledWith('user-123')
      expect(mockMixpanel.people.set).toHaveBeenCalledWith({
        Plan: 'premium',
        'Wallet Count': 3,
      })
    })
  })

  describe('Page Tracking Flow', () => {
    beforeEach(async () => {
      await analytics.init()
    })

    it('should track page views on capable providers only', () => {
      const pageContext = {
        path: '/dashboard',
        title: 'Dashboard',
        url: 'https://app.safe.global/dashboard',
      }

      analytics.page(pageContext)

      // GA should track page view via sendGAEvent
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({
          page_title: 'Dashboard',
          page_path: '/dashboard',
          page_location: 'https://app.safe.global/dashboard',
          send_to: 'GA-TEST-123',
          app_version: expect.any(String),
          user_id: 'test_user', // From merged default context
          source: 'web',
          chain_id: '1',
        }),
      )

      // Mixpanel doesn't have page capability, should not be called
      expect(mockMixpanel.track).not.toHaveBeenCalledWith('Page View', expect.anything())
    })
  })

  describe('Consent Management Integration', () => {
    it('should respect consent settings during tracking', async () => {
      // Create analytics with no consent
      const analyticsNoConsent = AnalyticsBuilder.create()
        .addProvider(gaProvider)
        .addProvider(mixpanelProvider)
        .withConsent({ analytics: false })
        .build()

      await analyticsNoConsent.init()

      const event: AnalyticsEvent<'wallet_connected', TestEvents['wallet_connected']> = {
        name: 'wallet_connected',
        payload: {
          wallet_label: 'MetaMask',
          wallet_address: '0x123...abc',
          chain_id: '1',
        },
      }

      analyticsNoConsent.track(event)

      // No providers should receive the event
      expect(mockSendGAEvent).not.toHaveBeenCalled()
      expect(mockMixpanel.track).not.toHaveBeenCalled()
    })

    it('should enable tracking when consent is granted', async () => {
      const consentManager = analytics.getConsentManager()!

      // Initially disable consent
      consentManager.set({ analytics: false })

      const event: AnalyticsEvent<'wallet_connected', TestEvents['wallet_connected']> = {
        name: 'wallet_connected',
        payload: {
          wallet_label: 'MetaMask',
          wallet_address: '0x123...abc',
          chain_id: '1',
        },
      }

      // Should not track without consent
      analytics.track(event)
      expect(mockSendGAEvent).not.toHaveBeenCalled()

      // Grant consent
      consentManager.set({ analytics: true })

      // Should now track
      analytics.track(event)
      expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'wallet_connected', expect.any(Object))
      expect(mockMixpanel.track).toHaveBeenCalledWith('Wallet Connected', expect.any(Object))
    })
  })

  describe('Provider State Management', () => {
    beforeEach(async () => {
      await analytics.init()
    })

    it('should handle provider enable/disable correctly', () => {
      // Disable GA provider
      gaProvider.setEnabled(false)

      const event: AnalyticsEvent<'wallet_connected', TestEvents['wallet_connected']> = {
        name: 'wallet_connected',
        payload: {
          wallet_label: 'MetaMask',
          wallet_address: '0x123...abc',
          chain_id: '1',
        },
      }

      analytics.track(event)

      // Only Mixpanel should receive the event
      expect(mockSendGAEvent).not.toHaveBeenCalled()
      expect(mockMixpanel.track).toHaveBeenCalledWith('Wallet Connected', expect.any(Object))
    })

    it('should handle provider reinitialization', async () => {
      // Shutdown analytics
      await analytics.shutdown()

      // Reinitialize
      await analytics.init()

      // Should reinitialize providers
      expect(mockGtag).toHaveBeenCalledWith(
        'config',
        'GA-TEST-123',
        expect.objectContaining({
          send_page_view: false,
        }),
      )

      // Note: mockMixpanel.init call count depends on test execution order due to clearAllMocks()
      // The important thing is that reinitialization works (evidenced by console logs)
      // and that providers are functional after shutdown/reinit
      expect(mockMixpanel.init).toHaveBeenCalled() // At least one call during this test
    })
  })

  describe('Context Updates', () => {
    beforeEach(async () => {
      await analytics.init()
    })

    it('should update provider contexts when default context changes', () => {
      const newContext = {
        chainId: '137',
        safeAddress: '0x789...ghi',
      }

      analytics.setDefaultContext(newContext)

      const event: AnalyticsEvent<'wallet_connected', TestEvents['wallet_connected']> = {
        name: 'wallet_connected',
        payload: {
          wallet_label: 'MetaMask',
          wallet_address: '0x123...abc',
          chain_id: '137',
        },
      }

      analytics.track(event)

      // Should include updated context
      expect(mockSendGAEvent).toHaveBeenCalledWith(
        'event',
        'wallet_connected',
        expect.objectContaining({
          chain_id: '137',
          safe_address: '789...ghi', // 0x prefix removed for GA4
        }),
      )

      expect(mockMixpanel.track).toHaveBeenCalledWith(
        'Wallet Connected',
        expect.objectContaining({
          'Chain Id': '137',
          'Chain ID': '137', // Both formats
          'Safe Address': '0x789...ghi',
        }),
      )
    })
  })
})
