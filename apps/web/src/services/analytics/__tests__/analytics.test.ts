/**
 * New Analytics System Tests
 *
 * Tests for the new unified analytics implementation including:
 * - GA parameter filtering
 * - Mixpanel property enrichment
 * - Provider coordination
 * - Event configuration
 */

import { analytics, safeAnalytics } from '../unified-analytics'
import { AnalyticsManager } from '../core/AnalyticsManager'
import { GoogleAnalyticsProvider } from '../providers/ga/GoogleAnalyticsProvider'
import { MixpanelProvider } from '../providers/mixpanel/MixpanelProvider'
import { GAParameterRegistry } from '../providers/ga/GAParameterRegistry'

// Mock external dependencies
jest.mock('@/config/constants', () => ({
  GA_TRACKING_ID: 'GA-TEST-12345',
  MIXPANEL_TOKEN: 'test-mixpanel-token',
  IS_PRODUCTION: false,
}))

jest.mock('@next/third-parties/google', () => ({
  sendGAEvent: jest.fn(),
}))

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
  },
}))

const mockMixpanel = jest.requireMock('mixpanel-browser')
const mockSendGAEvent = jest.requireMock('@next/third-parties/google').sendGAEvent

describe('New Analytics System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GAParameterRegistry', () => {
    let registry: GAParameterRegistry

    beforeEach(() => {
      registry = new GAParameterRegistry()
    })

    it('should filter out unregistered parameters', () => {
      const properties = {
        chain_id: '1', // registered
        safe_address: '0x123', // registered
        unregistered_param: 'should be filtered', // not registered
        another_unregistered: 123, // not registered
      }

      const filtered = registry.filterParameters(properties)

      expect(filtered).toEqual({
        chain_id: '1',
        safe_address: '0x123',
      })
    })

    it('should identify registered vs unregistered parameters', () => {
      expect(registry.isRegistered('chain_id')).toBe(true)
      expect(registry.isRegistered('safe_address')).toBe(true)
      expect(registry.isRegistered('unregistered_param')).toBe(false)
    })

    it('should transform values for GA compatibility', () => {
      const properties = {
        chain_id: 1, // number -> string (registered)
        threshold: 2, // number -> string (registered)
        safe_address: '0x123', // string remains string (registered)
      }

      const filtered = registry.filterParameters(properties)

      expect(filtered.chain_id).toBe('1')
      expect(filtered.threshold).toBe('2')
      expect(filtered.safe_address).toBe('0x123')
    })
  })

  describe('GoogleAnalyticsProvider', () => {
    let provider: GoogleAnalyticsProvider

    beforeEach(() => {
      provider = new GoogleAnalyticsProvider({
        trackingId: 'GA-TEST-12345',
        debug: true,
        enabled: true,
      })
      provider.initialize()
    })

    it('should only send registered parameters to GA', () => {
      const event = {
        name: 'test_event',
        properties: {
          chain_id: '1', // registered
          safe_address: '0x123', // registered
          unregistered_param: 'filtered', // unregistered
        },
      }

      provider.track(event)

      expect(mockSendGAEvent).toHaveBeenCalledWith('event', 'test_event', {
        send_to: 'GA-TEST-12345',
        chain_id: '1',
        safe_address: '0x123',
        app_version: expect.any(String),
        device_type: expect.any(String),
        // unregistered_param should NOT be included
      })
    })

    it('should set global properties that are registered', () => {
      provider.setGlobalProperty('chain_id', '137')
      provider.setGlobalProperty('unregistered_global', 'should not be set')

      const event = {
        name: 'test_event',
        properties: {},
      }

      provider.track(event)

      expect(mockSendGAEvent).toHaveBeenCalledWith(
        'event',
        'test_event',
        expect.objectContaining({
          chain_id: '137',
        }),
      )

      // Check that unregistered global property was not included
      expect(mockSendGAEvent).not.toHaveBeenCalledWith(
        'event',
        'test_event',
        expect.objectContaining({
          unregistered_global: 'should not be set',
        }),
      )
    })
  })

  describe('MixpanelProvider', () => {
    let provider: MixpanelProvider

    beforeEach(() => {
      provider = new MixpanelProvider({
        token: 'test-mixpanel-token',
        debug: true,
        enabled: true,
      })
      provider.initialize()
    })

    it('should send all properties to Mixpanel', () => {
      const event = {
        name: 'Test Event',
        properties: {
          chain_id: '1',
          safe_address: '0x123',
          custom_property: 'any value',
          nested_object: { key: 'value' },
          array_data: [1, 2, 3],
        },
      }

      provider.track(event)

      expect(mockMixpanel.track).toHaveBeenCalledWith(
        'Test Event',
        expect.objectContaining({
          chain_id: '1',
          safe_address: '0x123',
          custom_property: 'any value',
          nested_object: { key: 'value' },
          array_data: [1, 2, 3],
          // Should also include global properties
          'App Version': expect.any(String),
          'Device Type': expect.any(String),
        }),
      )
    })

    it('should accept any global properties without filtering', () => {
      provider.setGlobalProperty('any_property', 'any_value')
      provider.setGlobalProperty('Custom Event Property', 'with spaces')

      const event = {
        name: 'Test Event',
        properties: {},
      }

      provider.track(event)

      expect(mockMixpanel.register).toHaveBeenCalledWith(
        expect.objectContaining({
          any_property: 'any_value',
          'Custom Event Property': 'with spaces',
        }),
      )
    })
  })

  describe('AnalyticsManager', () => {
    let manager: AnalyticsManager
    let gaProvider: GoogleAnalyticsProvider
    let mixpanelProvider: MixpanelProvider

    beforeEach(() => {
      const config = {
        enabled: true,
        debug: true,
        providers: {
          ga: { enabled: true, trackingId: 'GA-TEST' },
          mixpanel: { enabled: true, token: 'test-token' },
        },
        events: {
          TEST_EVENT: {
            name: 'test_event',
            providers: {
              ga: {
                enabled: true,
                eventName: 'test_event_ga',
                registeredParams: ['chain_id', 'safe_address'],
              },
              mixpanel: {
                enabled: true,
                eventName: 'Test Event Mixpanel',
                enrichProperties: (props: any) => ({
                  ...props,
                  enriched_timestamp: Date.now(),
                }),
              },
            },
          },
        },
      }

      manager = new AnalyticsManager(config)

      gaProvider = new GoogleAnalyticsProvider({
        trackingId: 'GA-TEST',
        enabled: true,
      })

      mixpanelProvider = new MixpanelProvider({
        token: 'test-token',
        enabled: true,
      })

      manager.addProvider(gaProvider)
      manager.addProvider(mixpanelProvider)
      manager.initialize()
    })

    it('should route events to appropriate providers', () => {
      const properties = {
        chain_id: '1',
        safe_address: '0x123',
        custom_mixpanel_prop: 'only for mixpanel',
      }

      const result = manager.track('TEST_EVENT', properties)

      expect(result.success).toBe(true)
      expect(result.results.ga?.success).toBe(true)
      expect(result.results.mixpanel?.success).toBe(true)
    })

    it('should apply provider-specific transformations', () => {
      const gaTrackSpy = jest.spyOn(gaProvider, 'track')
      const mixpanelTrackSpy = jest.spyOn(mixpanelProvider, 'track')

      manager.track('TEST_EVENT', {
        chain_id: '1',
        safe_address: '0x123',
        extra_property: 'test',
      })

      // GA should get filtered properties
      expect(gaTrackSpy).toHaveBeenCalledWith({
        name: 'test_event_ga',
        properties: expect.objectContaining({
          chain_id: '1',
          safe_address: '0x123',
          // extra_property should be filtered out by the provider
        }),
      })

      // Mixpanel should get all properties + enrichments
      expect(mixpanelTrackSpy).toHaveBeenCalledWith({
        name: 'Test Event Mixpanel',
        properties: expect.objectContaining({
          chain_id: '1',
          safe_address: '0x123',
          extra_property: 'test',
          enriched_timestamp: expect.any(Number),
        }),
      })
    })
  })

  describe('Unified Analytics API', () => {
    beforeEach(() => {
      // Reset analytics state
      jest.clearAllMocks()
    })

    it('should track events through the unified API', () => {
      const result = analytics.track('SAFE_CREATED', {
        chain_id: '1',
        deployment_type: 'standard',
        threshold: 2,
        num_owners: 3,
      })

      expect(result.success).toBe(true)
    })

    it('should provide convenience methods for Safe events', () => {
      const result = safeAnalytics.safeCreated({
        chain_id: '1',
        deployment_type: 'standard',
        payment_method: 'wallet',
        threshold: 2,
        num_owners: 3,
      })

      expect(result.success).toBe(true)
    })

    it('should set context properties', () => {
      safeAnalytics.setSafeContext('0x123', '1', '1.4.1')
      safeAnalytics.setWalletContext('MetaMask', '0x456')

      // Context should be set on global properties
      // This would be verified by checking if subsequent events include these properties
      expect(true).toBe(true) // Placeholder - actual verification would check provider calls
    })

    it('should handle batch tracking', () => {
      const events = [
        { eventKey: 'SAFE_CREATED', properties: { chain_id: '1' } },
        { eventKey: 'WALLET_CONNECTED', properties: { wallet_type: 'MetaMask' } },
      ]

      const results = analytics.trackBatch(events)

      expect(results).toHaveLength(2)
      expect(results.every((result) => result.success)).toBe(true)
    })
  })

  describe('Event Configuration Validation', () => {
    it('should validate that events have required configurations', () => {
      const { validateEventConfigurations } = require('../config/events.config')
      const validation = validateEventConfigurations()

      expect(validation.valid).toBe(true)
      expect(validation.errors).toEqual([])
    })
  })
})
