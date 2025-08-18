/**
 * Cross-provider consistency tests
 * Verifies that the same events produce equivalent normalized data across all providers
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

import { GoogleAnalyticsProvider } from '../GoogleAnalyticsProvider'
import { MixpanelProvider } from '../MixpanelProvider'
import type { SafeEventMap, AnalyticsEvent } from '../../core'

// Get mocked instances

const mockMixpanel = jest.requireMock('mixpanel-browser')

// Mock gtag function for direct testing
const mockGtag = jest.fn()
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
})

// Test event types with complex payloads
type TestEvents = SafeEventMap & {
  wallet_connected: {
    wallet_label: string
    wallet_address: string
    chain_id: string
    connection_method: 'direct' | 'walletconnect' | 'injected'
    is_first_time: boolean
    user_count?: number
  }
  transaction_created: {
    tx_type: 'transfer_token' | 'transfer_nft' | 'contract_interaction'
    safe_address: string
    amount?: string
    asset_symbol?: string
    recipient_address?: string
    batch_size?: number
  }
  safe_app_launched: {
    app_name: string
    app_version: string
    launch_location: 'dashboard' | 'apps_list' | 'preview_drawer'
    app_category?: string
    is_custom_app: boolean
  }
}

describe('Cross-Provider Consistency', () => {
  let gaProvider: GoogleAnalyticsProvider<TestEvents>
  let mixpanelProvider: MixpanelProvider<TestEvents>

  const testContext = {
    userId: 'test-user-123',
    source: 'web' as const,
    chainId: '1',
    safeAddress: '0x1234567890123456789012345678901234567890',
    app_version: '1.2.3',
    device_type: 'desktop',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    gaProvider = new GoogleAnalyticsProvider({
      measurementId: 'GA-TEST-123',
      debugMode: true,
      gtag: mockGtag,
    })

    mixpanelProvider = new MixpanelProvider({
      debugMode: true,
    })

    // Initialize providers
    gaProvider.init({ defaultContext: testContext })
    mixpanelProvider.init({ defaultContext: testContext })
  })

  describe('Event Name Normalization', () => {
    const testCases = [
      {
        input: 'wallet_connected',
        expectedGA: 'wallet_connected', // snake_case preserved
        expectedMixpanel: 'Wallet Connected', // Title Case
      },
      {
        input: 'SafeAppLaunched',
        expectedGA: 'safe_app_launched', // camelCase -> snake_case
        expectedMixpanel: 'Safe App Launched', // camelCase -> Title Case
      },
      {
        input: 'transaction-created',
        expectedGA: 'transaction_created', // kebab-case -> snake_case
        expectedMixpanel: 'Transaction Created', // kebab-case -> Title Case
      },
      {
        input: 'USER_REGISTERED',
        expectedGA: 'user_registered', // UPPER_SNAKE_CASE -> snake_case
        expectedMixpanel: 'User Registered', // UPPER_SNAKE_CASE -> Title Case
      },
    ]

    testCases.forEach(({ input, expectedGA, expectedMixpanel }) => {
      it(`should normalize "${input}" consistently across providers`, () => {
        const event = {
          name: input as keyof TestEvents,
          payload: {} as any,
          context: testContext,
        }

        gaProvider.track(event)
        mixpanelProvider.track(event)

        // Verify GA uses snake_case
        expect(mockGtag).toHaveBeenCalledWith('event', expectedGA, expect.any(Object))

        // Verify Mixpanel uses Title Case
        expect(mockMixpanel.track).toHaveBeenCalledWith(expectedMixpanel, expect.any(Object))
      })
    })
  })

  describe('Payload Property Transformation', () => {
    it('should transform property names consistently', () => {
      const event: AnalyticsEvent<'wallet_connected', TestEvents['wallet_connected']> = {
        name: 'wallet_connected',
        payload: {
          wallet_label: 'MetaMask',
          wallet_address: '0xabc123...',
          chain_id: '1',
          connection_method: 'injected',
          is_first_time: true,
          user_count: 5,
        },
        context: testContext,
      }

      gaProvider.track(event)
      mixpanelProvider.track(event)

      // GA should use snake_case properties
      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'wallet_connected',
        expect.objectContaining({
          wallet_label: 'MetaMask',
          wallet_address: '0xabc123...',
          chain_id: '1',
          connection_method: 'injected',
          is_first_time: true,
          user_count: 5,
          // Context properties also snake_case
          user_id: 'test-user-123',
          safe_address: '0x1234567890123456789012345678901234567890',
          app_version: '1.2.3',
          device_type: 'desktop',
        }),
      )

      // Mixpanel should use Title Case properties
      expect(mockMixpanel.track).toHaveBeenCalledWith(
        'Wallet Connected',
        expect.objectContaining({
          'Wallet Label': 'MetaMask',
          'Wallet Address': '0xabc123...',
          'Chain Id': '1',
          'Connection Method': 'injected',
          'Is First Time': true,
          'User Count': 5,
          // Context properties also Title Case
          'User Id': 'test-user-123',
          'Safe Address': '0x1234567890123456789012345678901234567890',
          'App Version': '1.2.3',
          'Device Type': 'desktop',
        }),
      )
    })

    it('should handle optional properties consistently', () => {
      const event: AnalyticsEvent<'transaction_created', TestEvents['transaction_created']> = {
        name: 'transaction_created',
        payload: {
          tx_type: 'transfer_token',
          safe_address: '0xdef456...',
          // Optional properties omitted
        },
        context: testContext,
      }

      gaProvider.track(event)
      mixpanelProvider.track(event)

      // Both providers should handle missing optional properties
      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'transaction_created',
        expect.objectContaining({
          tx_type: 'transfer_token',
          safe_address: '0xdef456...',
          // Should not include undefined values
        }),
      )

      expect(mockMixpanel.track).toHaveBeenCalledWith(
        'Transaction Created',
        expect.objectContaining({
          'Tx Type': 'transfer_token',
          'Safe Address': '0xdef456...',
          // Should not include undefined values
        }),
      )

      // Verify no undefined values are passed
      const gaCall = mockGtag.mock.calls[0]
      const mixpanelCall = mockMixpanel.track.mock.calls[0]

      expect(Object.values(gaCall[2])).not.toContain(undefined)
      expect(Object.values(mixpanelCall[1])).not.toContain(undefined)
    })
  })

  describe('Data Type Preservation', () => {
    it('should preserve data types across providers', () => {
      const event: AnalyticsEvent<'safe_app_launched', TestEvents['safe_app_launched']> = {
        name: 'safe_app_launched',
        payload: {
          app_name: 'Test App',
          app_version: '2.1.0',
          launch_location: 'dashboard',
          app_category: 'defi',
          is_custom_app: false, // boolean
        },
        context: testContext,
      }

      gaProvider.track(event)
      mixpanelProvider.track(event)

      // Verify boolean values are preserved
      const gaProps = mockGtag.mock.calls[0][2]
      const mixpanelProps = mockMixpanel.track.mock.calls[0][1]

      expect(gaProps.is_custom_app).toBe(false)
      expect(mixpanelProps['Is Custom App']).toBe(false)

      // Verify string values are preserved
      expect(gaProps.app_name).toBe('Test App')
      expect(mixpanelProps['App Name']).toBe('Test App')

      expect(gaProps.launch_location).toBe('dashboard')
      expect(mixpanelProps['Launch Location']).toBe('dashboard')
    })

    it('should handle number values consistently', () => {
      const event: AnalyticsEvent<'wallet_connected', TestEvents['wallet_connected']> = {
        name: 'wallet_connected',
        payload: {
          wallet_label: 'MetaMask',
          wallet_address: '0x123...',
          chain_id: '1',
          connection_method: 'direct',
          is_first_time: true,
          user_count: 42, // number
        },
        context: testContext,
      }

      gaProvider.track(event)
      mixpanelProvider.track(event)

      const gaProps = mockGtag.mock.calls[0][2]
      const mixpanelProps = mockMixpanel.track.mock.calls[0][1]

      expect(gaProps.user_count).toBe(42)
      expect(mixpanelProps['User Count']).toBe(42)
    })
  })

  describe('Context Merging Consistency', () => {
    it('should merge event context with default context consistently', () => {
      const event: AnalyticsEvent<'transaction_created', TestEvents['transaction_created']> = {
        name: 'transaction_created',
        payload: {
          tx_type: 'transfer_nft',
          safe_address: '0x999...',
        },
        context: {
          chainId: '137', // Override default
        },
      }

      gaProvider.track(event)
      mixpanelProvider.track(event)

      // Both should have merged context with event context taking precedence
      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'transaction_created',
        expect.objectContaining({
          // Default context
          user_id: 'test-user-123',
          source: 'web' as const,
          safe_address: '0x1234567890123456789012345678901234567890',
          app_version: '1.2.3',
          device_type: 'desktop',
          // Overridden by event context
          chain_id: '137',
          // From event context
          // From event payload
          tx_type: 'transfer_nft',
        }),
      )

      expect(mockMixpanel.track).toHaveBeenCalledWith(
        'Transaction Created',
        expect.objectContaining({
          // Default context (Title Case)
          'User Id': 'test-user-123',
          Source: 'web',
          'Safe Address': '0x1234567890123456789012345678901234567890',
          'App Version': '1.2.3',
          'Device Type': 'desktop',
          // Overridden by event context
          'Chain Id': '137',
          // From event context
          // From event payload
          'Tx Type': 'transfer_nft',
        }),
      )
    })
  })

  describe('User Identification Consistency', () => {
    it('should identify users with equivalent data across providers', () => {
      const userId = 'user-test-456'
      const traits = {
        wallet_count: 3,
        safe_count: 2,
        preferred_chain: 'ethereum',
        is_premium_user: true,
        registration_date: '2024-01-15',
      }

      gaProvider.identify(userId, traits)
      mixpanelProvider.identify(userId, traits)

      // GA should set user ID and custom parameters
      expect(mockGtag).toHaveBeenCalledWith('config', 'GA-TEST-123', {
        user_id: 'user_test_456', // Sanitized for GA
        custom_map: expect.objectContaining({
          wallet_count: 3,
          safe_count: 2,
          preferred_chain: 'ethereum',
          is_premium_user: true,
          registration_date: '2024-01-15',
        }),
      })

      // Mixpanel should identify and set user properties
      expect(mockMixpanel.identify).toHaveBeenCalledWith('user_test_456')
      expect(mockMixpanel.people.set).toHaveBeenCalledWith({
        'Wallet Count': 3,
        'Safe Count': 2,
        'Preferred Chain': 'ethereum',
        'Is Premium User': true,
        'Registration Date': '2024-01-15',
      })
    })
  })

  describe('Error Handling Consistency', () => {
    it('should handle tracking errors gracefully without affecting other providers', () => {
      // Make GA throw an error
      mockGtag.mockImplementationOnce(() => {
        throw new Error('GA tracking error')
      })

      const event: AnalyticsEvent<'wallet_connected', TestEvents['wallet_connected']> = {
        name: 'wallet_connected',
        payload: {
          wallet_label: 'TestWallet',
          wallet_address: '0x123...',
          chain_id: '1',
          connection_method: 'direct',
          is_first_time: false,
        },
        context: testContext,
      }

      // Should not throw
      expect(() => gaProvider.track(event)).not.toThrow()
      expect(() => mixpanelProvider.track(event)).not.toThrow()

      // Mixpanel should still work
      expect(mockMixpanel.track).toHaveBeenCalledWith('Wallet Connected', expect.any(Object))
    })
  })

  describe('Edge Cases and Special Characters', () => {
    it('should handle special characters in event names and properties consistently', () => {
      const event = {
        name: 'special_event_with-symbols&numbers123' as keyof TestEvents,
        payload: {
          'property-with-dashes': 'value1',
          property_with_underscores: 'value2',
          propertyWithCamelCase: 'value3',
          'property with spaces': 'value4', // This should be normalized
        } as any,
        context: testContext,
      }

      gaProvider.track(event)
      mixpanelProvider.track(event)

      // Both providers should normalize the event name
      expect(mockGtag).toHaveBeenCalledWith('event', 'special_event_with_symbols_numbers123', expect.any(Object))
      expect(mockMixpanel.track).toHaveBeenCalledWith('Special Event With Symbols Numbers123', expect.any(Object))

      // Properties should be normalized too
      const gaProps = mockGtag.mock.calls[0][2]
      const mixpanelProps = mockMixpanel.track.mock.calls[0][1]

      expect(gaProps.property_with_dashes).toBe('value1')
      expect(gaProps.property_with_underscores).toBe('value2')
      expect(gaProps.property_with_camel_case).toBe('value3')
      expect(gaProps.property_with_spaces).toBe('value4')

      expect(mixpanelProps['Property With Dashes']).toBe('value1')
      expect(mixpanelProps['Property With Underscores']).toBe('value2')
      expect(mixpanelProps['Property With Camel Case']).toBe('value3')
      expect(mixpanelProps['Property With Spaces']).toBe('value4')
    })
  })
})
