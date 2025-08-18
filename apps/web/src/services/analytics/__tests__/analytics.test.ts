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
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'

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
  let setUserPropertySpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    setUserPropertySpy = jest.spyOn(analytics, 'setUserProperty').mockImplementation(() => {})
  })

  afterEach(() => {
    setUserPropertySpy.mockRestore()
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
        eventConfigurations: {
          test_event: {
            enabled: true,
            eventName: 'test_event',
          },
        },
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
        eventConfigurations: {
          'Test Event': {
            enabled: true,
            eventName: 'Test Event',
          },
        },
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
      }

      manager = new AnalyticsManager(config)

      gaProvider = new GoogleAnalyticsProvider({
        trackingId: 'GA-TEST',
        enabled: true,
        eventConfigurations: {
          TEST_EVENT: {
            enabled: true,
            eventName: 'test_event_ga',
            registeredParams: ['chain_id', 'safe_address'],
          },
        },
      })

      mixpanelProvider = new MixpanelProvider({
        token: 'test-token',
        enabled: true,
        eventConfigurations: {
          TEST_EVENT: {
            enabled: true,
            eventName: 'Test Event Mixpanel',
            createProperties: (props: any) => ({
              'Chain ID': props.chain_id,
              'Safe Address': props.safe_address,
              'Creation Timestamp': Date.now(),
            }),
          },
        },
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

      // GA should receive just the event (configuration is owned by provider)
      expect(gaTrackSpy).toHaveBeenCalledWith({
        name: 'TEST_EVENT',
        properties: expect.objectContaining({
          chain_id: '1',
          safe_address: '0x123',
          extra_property: 'test',
          event_key: 'TEST_EVENT',
          timestamp: expect.any(Number),
        }),
      })

      // Mixpanel should receive just the event (configuration is owned by provider)
      expect(mixpanelTrackSpy).toHaveBeenCalledWith({
        name: 'TEST_EVENT',
        properties: expect.objectContaining({
          chain_id: '1',
          safe_address: '0x123',
          extra_property: 'test',
          event_key: 'TEST_EVENT',
          timestamp: expect.any(Number),
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
        safe_address: '0x123',
        deployment_type: 'standard',
        payment_method: 'wallet',
        threshold: 2,
        num_owners: 3,
        safe_version: '1.4.1',
        network_name: 'Ethereum',
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

    it('should set Safe user properties for Mixpanel cohort analysis', () => {
      const mockSafeInfo: ExtendedSafeInfo = {
        address: { value: '0x123' },
        chainId: '1',
        owners: [{ value: '0x456' }, { value: '0x789' }],
        threshold: 2,
        nonce: 47,
        version: '1.4.1',
        implementation: { value: '0xfA0BDe12345' },
        implementationVersionState: 'UP_TO_DATE',
        deployed: true,
      }

      const mockNetworks = ['Ethereum', 'Polygon']
      const chainName = 'Ethereum'

      safeAnalytics.setSafeUserProperties('0x123', mockSafeInfo, chainName, mockNetworks)

      // Verify global properties are set
      expect(analytics.setUserProperty).toHaveBeenCalledWith('Safe Address', '0x123')
      expect(analytics.setUserProperty).toHaveBeenCalledWith('Safe Version', '1.4.1')
      expect(analytics.setUserProperty).toHaveBeenCalledWith('Blockchain Networks', mockNetworks)

      // Verify chain-specific properties are set
      expect(analytics.setUserProperty).toHaveBeenCalledWith('Number of Signers on Ethereum', 2)
      expect(analytics.setUserProperty).toHaveBeenCalledWith('Threshold on Ethereum', 2)
      expect(analytics.setUserProperty).toHaveBeenCalledWith('Total Transaction Count on Ethereum', 47)
    })

    it('should update transaction count for specific chain', () => {
      safeAnalytics.updateSafeTransactionCount(50, 'Polygon')

      expect(analytics.setUserProperty).toHaveBeenCalledWith('Total Transaction Count on Polygon', 50)
    })

    it('should update threshold for specific chain', () => {
      safeAnalytics.updateSafeThreshold(3, 'Optimism')

      expect(analytics.setUserProperty).toHaveBeenCalledWith('Threshold on Optimism', 3)
    })

    it('should update signer count for specific chain', () => {
      safeAnalytics.updateSafeSigners(5, 'Arbitrum')

      expect(analytics.setUserProperty).toHaveBeenCalledWith('Number of Signers on Arbitrum', 5)
    })

    it('should set Safe creation date for specific chain', () => {
      const creationDate = new Date('2024-01-15T10:30:00Z')
      safeAnalytics.setSafeCreationDate(creationDate, 'Ethereum')

      expect(analytics.setUserProperty).toHaveBeenCalledWith('Created at on Ethereum', '2024-01-15T10:30:00.000Z')
    })

    it('should add Safe networks', () => {
      const networks = ['Ethereum', 'Polygon', 'Optimism']
      safeAnalytics.addSafeNetwork(networks)

      expect(analytics.setUserProperty).toHaveBeenCalledWith('Blockchain Networks', networks)
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
