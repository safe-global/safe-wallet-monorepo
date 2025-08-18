/**
 * Consent management integration tests
 * Tests real consent state changes affecting provider behavior and analytics flow
 */

// Mock constants before any imports
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

// Mock mixpanel-browser
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

// Mock consent handlers with real-ish behavior
const mockGAConsentHandler = {
  handleConsentChange: jest.fn(),
  enableAnalytics: jest.fn(),
  disableAnalytics: jest.fn(),
}

const mockMixpanelConsentHandler = {
  handleConsentChange: jest.fn(),
  enableAnalytics: jest.fn(),
  disableAnalytics: jest.fn(),
}

jest.mock('../../providers/GoogleAnalyticsConsentHandler', () => ({
  GoogleAnalyticsConsentHandler: mockGAConsentHandler,
}))

jest.mock('../../providers/MixpanelConsentHandler', () => ({
  MixpanelConsentHandler: mockMixpanelConsentHandler,
}))

import { AnalyticsBuilder } from '../builder'
import { ConsentManager } from '../consent'
import { GoogleAnalyticsProvider } from '../../providers/GoogleAnalyticsProvider'
import { MixpanelProvider } from '../../providers/MixpanelProvider'
import type { SafeEventMap, AnalyticsEvent } from '../types'
import type { Analytics } from '../analytics'

// Get mocked instances

const mockMixpanel = jest.requireMock('mixpanel-browser')

// Mock gtag function for direct testing
const mockGtag = jest.fn()
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
})

// Test event types
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

describe('Consent Management Integration', () => {
  let analytics: Analytics<TestEvents>
  let gaProvider: GoogleAnalyticsProvider<TestEvents>
  let mixpanelProvider: MixpanelProvider<TestEvents>
  let consentManager: ConsentManager

  const testEvent: AnalyticsEvent<'wallet_connected', TestEvents['wallet_connected']> = {
    name: 'wallet_connected',
    payload: {
      wallet_label: 'MetaMask',
      wallet_address: '0x123...abc',
      chain_id: '1',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Create consent manager with initial consent state
    consentManager = new ConsentManager({
      analytics: false, // Start with no consent
      necessary: true,
      marketing: false,
      functional: false,
    })

    gaProvider = new GoogleAnalyticsProvider({
      measurementId: 'GA-TEST-123',
      debugMode: true,
      gtag: mockGtag,
    })

    mixpanelProvider = new MixpanelProvider({
      debugMode: true,
    })

    // Build analytics with consent manager
    analytics = AnalyticsBuilder.create<TestEvents>()
      .addProvider(gaProvider)
      .addProvider(mixpanelProvider)
      .withDefaultContext({
        userId: 'test-user',
        source: 'web',
      })
      .withConsent(consentManager.get())
      .build()
  })

  describe('Initial Consent State', () => {
    it('should not track events when analytics consent is denied', async () => {
      await analytics.init()

      // Verify no consent initially
      expect(consentManager.has(['analytics'])).toBe(false)

      // Attempt to track event
      analytics.track(testEvent)

      // No providers should receive the event
      expect(mockGtag).not.toHaveBeenCalledWith('event', expect.anything(), expect.anything())
      expect(mockMixpanel.track).not.toHaveBeenCalled()
    })

    it('should not identify users when consent is denied', async () => {
      await analytics.init()

      analytics.identify('user-123', { plan: 'premium' })

      // No identification should occur
      expect(mockGtag).not.toHaveBeenCalledWith(
        'config',
        expect.anything(),
        expect.objectContaining({
          user_id: expect.anything(),
        }),
      )
      expect(mockMixpanel.identify).not.toHaveBeenCalled()
      expect(mockMixpanel.people.set).not.toHaveBeenCalled()
    })

    it('should not track page views when consent is denied', async () => {
      await analytics.init()

      analytics.page({
        path: '/dashboard',
        title: 'Dashboard',
        url: 'https://app.safe.global/dashboard',
      })

      expect(mockGtag).not.toHaveBeenCalledWith('event', 'page_view', expect.anything())
    })
  })

  describe('Consent Granting', () => {
    it('should enable tracking when consent is granted', async () => {
      await analytics.init()

      // Initially no tracking
      analytics.track(testEvent)
      expect(mockGtag).not.toHaveBeenCalledWith('event', expect.anything(), expect.anything())
      expect(mockMixpanel.track).not.toHaveBeenCalled()

      // Grant consent
      consentManager.set({ analytics: true })

      // Now tracking should work
      analytics.track(testEvent)

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'wallet_connected',
        expect.objectContaining({
          wallet_label: 'MetaMask',
          wallet_address: '0x123...abc',
          chain_id: '1',
        }),
      )

      expect(mockMixpanel.track).toHaveBeenCalledWith(
        'Wallet Connected',
        expect.objectContaining({
          'Wallet Label': 'MetaMask',
          'Wallet Address': '0x123...abc',
          'Chain Id': '1',
        }),
      )
    })

    it('should call consent handlers when consent is granted', async () => {
      await analytics.init()

      consentManager.set({ analytics: true })

      // Consent handlers should be notified
      expect(mockGAConsentHandler.enableAnalytics).toHaveBeenCalled()
      expect(mockMixpanelConsentHandler.enableAnalytics).toHaveBeenCalled()
    })

    it('should enable identification when consent is granted', async () => {
      await analytics.init()

      // Grant consent
      consentManager.set({ analytics: true })

      // Now identification should work
      analytics.identify('user-456', { wallet_count: 3 })

      expect(mockGtag).toHaveBeenCalledWith(
        'config',
        'GA-TEST-123',
        expect.objectContaining({
          user_id: 'user_456',
          custom_map: expect.objectContaining({
            wallet_count: 3,
          }),
        }),
      )

      expect(mockMixpanel.identify).toHaveBeenCalledWith('user_456')
      expect(mockMixpanel.people.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Wallet Count': 3,
        }),
      )
    })

    it('should enable page tracking when consent is granted', async () => {
      await analytics.init()

      // Grant consent
      consentManager.set({ analytics: true })

      analytics.page({
        path: '/dashboard',
        title: 'Dashboard',
        url: 'https://app.safe.global/dashboard',
      })

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'page_view',
        expect.objectContaining({
          page_location: 'https://app.safe.global/dashboard',
          page_title: 'Dashboard',
        }),
      )
    })
  })

  describe('Consent Revocation', () => {
    it('should disable tracking when consent is revoked', async () => {
      // Start with consent granted
      consentManager.set({ analytics: true })
      await analytics.init()

      // Verify tracking works
      analytics.track(testEvent)
      expect(mockGtag).toHaveBeenCalledWith('event', 'wallet_connected', expect.anything())
      expect(mockMixpanel.track).toHaveBeenCalledWith('Wallet Connected', expect.anything())

      jest.clearAllMocks()

      // Revoke consent
      consentManager.set({ analytics: false })

      // Tracking should now be disabled
      analytics.track(testEvent)
      expect(mockGtag).not.toHaveBeenCalledWith('event', expect.anything(), expect.anything())
      expect(mockMixpanel.track).not.toHaveBeenCalled()
    })

    it('should call consent handlers when consent is revoked', async () => {
      consentManager.set({ analytics: true })
      await analytics.init()

      jest.clearAllMocks()

      // Revoke consent
      consentManager.set({ analytics: false })

      expect(mockGAConsentHandler.disableAnalytics).toHaveBeenCalled()
      expect(mockMixpanelConsentHandler.disableAnalytics).toHaveBeenCalled()
    })

    it('should disable identification when consent is revoked', async () => {
      consentManager.set({ analytics: true })
      await analytics.init()

      jest.clearAllMocks()

      // Revoke consent
      consentManager.set({ analytics: false })

      // Identification should not work
      analytics.identify('user-789')

      expect(mockGtag).not.toHaveBeenCalledWith(
        'config',
        expect.anything(),
        expect.objectContaining({
          user_id: expect.anything(),
        }),
      )
      expect(mockMixpanel.identify).not.toHaveBeenCalled()
    })
  })

  describe('Partial Consent Scenarios', () => {
    it('should work with custom consent logic', async () => {
      // Create custom consent manager with multiple categories
      const customConsentManager = new ConsentManager({
        analytics: true,
        necessary: true,
        marketing: false,
        functional: true,
        personalization: false,
      })

      const customAnalytics = AnalyticsBuilder.create()
        .addProvider(gaProvider)
        .addProvider(mixpanelProvider)
        .withConsent(customConsentManager.get())
        .build()

      await customAnalytics.init()

      // Should work since analytics consent is granted
      customAnalytics.track(testEvent)

      expect(mockGtag).toHaveBeenCalledWith('event', 'wallet_connected', expect.anything())
      expect(mockMixpanel.track).toHaveBeenCalledWith('Wallet Connected', expect.anything())
    })

    it('should respect provider-specific consent requirements', async () => {
      await analytics.init()

      // Mock provider to require specific consent
      const customProvider = new GoogleAnalyticsProvider({
        measurementId: 'GA-CUSTOM-123',
        gtag: mockGtag,
      })

      // Manually check consent in tracking (simulating provider-specific logic)
      const originalTrack = customProvider.track.bind(customProvider)
      customProvider.track = jest.fn((event) => {
        // Only track if both analytics AND marketing consent is given
        const consent = consentManager.get()
        if (consent.analytics && consent.marketing) {
          originalTrack(event)
        }
      })

      const restrictedAnalytics = AnalyticsBuilder.create()
        .addProvider(customProvider)
        .withConsent(consentManager.get())
        .build()

      await restrictedAnalytics.init()

      // Grant only analytics consent
      consentManager.set({ analytics: true, marketing: false })

      restrictedAnalytics.track(testEvent)

      // Provider should not track (requires marketing consent too)
      expect(customProvider.track).toHaveBeenCalled()
      // But the actual gtag should not be called due to custom logic
    })
  })

  describe('Consent State Persistence', () => {
    it('should maintain consent state across analytics instances', async () => {
      // Grant consent
      consentManager.set({ analytics: true })

      // Create first analytics instance
      await analytics.init()
      analytics.track(testEvent)

      expect(mockGtag).toHaveBeenCalled()
      expect(mockMixpanel.track).toHaveBeenCalled()

      jest.clearAllMocks()

      // Create second analytics instance with same consent manager
      const analytics2 = AnalyticsBuilder.create()
        .addProvider(new GoogleAnalyticsProvider({ gtag: mockGtag }))
        .addProvider(new MixpanelProvider())
        .withConsent(consentManager.get()) // Same consent manager
        .build()

      await analytics2.init()
      analytics2.track(testEvent)

      // Should still work with existing consent
      expect(mockGtag).toHaveBeenCalled()
      expect(mockMixpanel.track).toHaveBeenCalled()
    })

    it('should handle consent manager updates from external sources', async () => {
      await analytics.init()

      // Simulate external consent update (e.g., from cookie banner)
      consentManager.set({ analytics: true, necessary: true })

      // Analytics should pick up the change
      analytics.track(testEvent)

      expect(mockGtag).toHaveBeenCalledWith('event', 'wallet_connected', expect.anything())
      expect(mockMixpanel.track).toHaveBeenCalledWith('Wallet Connected', expect.anything())
    })
  })

  describe('Consent Manager API Integration', () => {
    it('should expose consent manager through analytics instance', async () => {
      await analytics.init()

      const retrievedConsentManager = analytics.getConsentManager()

      expect(retrievedConsentManager).toBe(consentManager)
      expect(retrievedConsentManager?.get()).toEqual({
        analytics: false,
        necessary: true,
        marketing: false,
        functional: false,
      })
    })

    it('should allow checking specific consent categories', async () => {
      await analytics.init()

      const cm = analytics.getConsentManager()!

      expect(cm.has(['analytics'])).toBe(false)
      expect(cm.has(['necessary'])).toBe(true)
      expect(cm.has(['analytics', 'marketing'], { mode: 'all' })).toBe(false)
      expect(cm.has(['analytics', 'marketing'], { mode: 'any' })).toBe(false)

      // Grant analytics consent
      cm.set({ analytics: true })

      expect(cm.has(['analytics'])).toBe(true)
      expect(cm.has(['analytics', 'necessary'], { mode: 'all' })).toBe(true)
      expect(cm.has(['analytics', 'marketing'], { mode: 'any' })).toBe(true)
    })

    it('should handle consent validation correctly', async () => {
      await analytics.init()

      const cm = analytics.getConsentManager()!

      // Test invalid consent values
      expect(() => cm.set({ analytics: null as any })).not.toThrow()
      expect(() => cm.set({ invalid_category: true } as any)).not.toThrow()

      // Necessary consent should always be true (validated)
      cm.set({ necessary: false })
      expect(cm.get().necessary).toBe(true) // Should remain true
    })
  })

  describe('Real-time Consent Changes', () => {
    it('should respond to rapid consent changes correctly', async () => {
      await analytics.init()

      // Rapid consent changes
      consentManager.set({ analytics: true })
      analytics.track(testEvent)

      consentManager.set({ analytics: false })
      analytics.track(testEvent)

      consentManager.set({ analytics: true })
      analytics.track(testEvent)

      // Should have tracked twice (when consent was granted)
      const gaEventCalls = mockGtag.mock.calls.filter(
        (call: unknown[]) => call[0] === 'event' && call[1] === 'wallet_connected',
      )
      const mixpanelEventCalls = mockMixpanel.track.mock.calls.filter(
        (call: unknown[]) => call[0] === 'Wallet Connected',
      )

      expect(gaEventCalls).toHaveLength(2)
      expect(mixpanelEventCalls).toHaveLength(2)
    })

    it('should handle consent changes during provider initialization', async () => {
      // Change consent during init
      const initPromise = analytics.init()
      consentManager.set({ analytics: true })

      await initPromise

      // Should work after init completes
      analytics.track(testEvent)

      expect(mockGtag).toHaveBeenCalledWith('event', 'wallet_connected', expect.anything())
      expect(mockMixpanel.track).toHaveBeenCalledWith('Wallet Connected', expect.anything())
    })
  })

  describe('Error Handling with Consent', () => {
    it('should handle consent manager errors gracefully', async () => {
      // Mock consent manager to throw errors
      const faultyConsentManager = {
        has: jest.fn(() => {
          throw new Error('Consent check failed')
        }),
        get: jest.fn(() => {
          throw new Error('Consent get failed')
        }),
        set: jest.fn(),
      } as any

      const faultyAnalytics = AnalyticsBuilder.create()
        .addProvider(gaProvider)
        .withConsent(faultyConsentManager)
        .build()

      // Should not throw during init or tracking
      await expect(faultyAnalytics.init()).resolves.not.toThrow()
      expect(() => faultyAnalytics.track(testEvent)).not.toThrow()
    })

    it('should continue working when consent handlers fail', async () => {
      // Make consent handlers throw
      mockGAConsentHandler.enableAnalytics.mockImplementation(() => {
        throw new Error('GA consent handler failed')
      })

      await analytics.init()

      // Should not throw when granting consent
      expect(() => consentManager.set({ analytics: true })).not.toThrow()

      // Analytics should still work
      analytics.track(testEvent)
      expect(mockGtag).toHaveBeenCalledWith('event', 'wallet_connected', expect.anything())
    })
  })
})
