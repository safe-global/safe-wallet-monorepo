/**
 * Unit tests for MixpanelProvider
 */

import { MixpanelProvider } from '../MixpanelProvider'
import type { AnalyticsEvent, SafeEventMap } from '../../core'
import * as mixpanel from '../../mixpanel'

// Mock Mixpanel functions
jest.mock('../../mixpanel', () => ({
  mixpanelInit: jest.fn(),
  mixpanelTrack: jest.fn(),
  mixpanelIdentify: jest.fn(),
  mixpanelSetUserProperties: jest.fn(),
}))

const mockMixpanel = {
  mixpanelInit: mixpanel.mixpanelInit as jest.MockedFunction<typeof mixpanel.mixpanelInit>,
  mixpanelTrack: mixpanel.mixpanelTrack as jest.MockedFunction<typeof mixpanel.mixpanelTrack>,
  mixpanelIdentify: mixpanel.mixpanelIdentify as jest.MockedFunction<typeof mixpanel.mixpanelIdentify>,
  mixpanelSetUserProperties: mixpanel.mixpanelSetUserProperties as jest.MockedFunction<
    typeof mixpanel.mixpanelSetUserProperties
  >,
}

// Test event types
type TestEvents = SafeEventMap & {
  'Safe Created': { network: string; threshold: number }
  'Transaction Confirmed': { txHash: string; value: number }
  'Wallet Connected': { walletType: string; address: string }
  'Safe App Launched': { appName: string; version: string }
  'Custom Event': { customField: string }
}

describe('MixpanelProvider', () => {
  let provider: MixpanelProvider<TestEvents>

  beforeEach(() => {
    jest.clearAllMocks()

    provider = new MixpanelProvider<TestEvents>({
      debugMode: true,
    })
  })

  describe('Provider Interface', () => {
    it('should have correct provider ID', () => {
      expect(provider.id).toBe('mixpanel')
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
    it('should initialize Mixpanel successfully', () => {
      provider.init()

      expect(mockMixpanel.mixpanelInit).toHaveBeenCalled()
    })

    it('should set user ID if provided in context', () => {
      provider.init({ defaultContext: { userId: 'user-123' } })

      expect(mockMixpanel.mixpanelInit).toHaveBeenCalled()
      expect(mockMixpanel.mixpanelIdentify).toHaveBeenCalledWith('user-123')
    })

    it('should handle initialization errors', () => {
      // Create a fresh provider for error testing
      const errorProvider = new MixpanelProvider<TestEvents>({ debugMode: true })

      mockMixpanel.mixpanelInit.mockImplementationOnce(() => {
        throw new Error('Mixpanel init failed')
      })

      expect(() => errorProvider.init()).toThrow('Mixpanel init failed')
    })

    it('should not initialize twice', () => {
      provider.init()
      provider.init() // Second call

      expect(mockMixpanel.mixpanelInit).toHaveBeenCalledTimes(1)
    })
  })

  describe('User Identification', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
    })

    it('should identify users with sanitized user ID', () => {
      provider.identify('user-123')

      expect(mockMixpanel.mixpanelIdentify).toHaveBeenCalledWith('user-123')
    })

    it('should set user properties from traits', () => {
      provider.identify('user-123', { walletType: 'metamask', chainId: '1' })

      expect(mockMixpanel.mixpanelIdentify).toHaveBeenCalledWith('user-123')
      expect(mockMixpanel.mixpanelSetUserProperties).toHaveBeenCalledWith({
        'Wallet Type': 'metamask',
        'Chain Id': '1',
      })
    })

    it('should skip identification when disabled', () => {
      provider.setEnabled(false)
      provider.identify('user-123')

      expect(mockMixpanel.mixpanelIdentify).not.toHaveBeenCalled()
    })

    it('should skip identification when not initialized', () => {
      const uninitializedProvider = new MixpanelProvider()
      uninitializedProvider.identify('user-123')

      expect(mockMixpanel.mixpanelIdentify).not.toHaveBeenCalled()
    })
  })

  describe('Event Tracking', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
    })

    it('should track events with normalized names', () => {
      const event: AnalyticsEvent = {
        name: 'safe_created',
        payload: { network: 'mainnet', threshold: 2 },
        context: { chainId: '1', safeAddress: '0x123' },
      }

      provider.track(event)

      expect(mockMixpanel.mixpanelTrack).toHaveBeenCalledWith('Safe Created', {
        Network: 'mainnet',
        Threshold: 2,
        'Chain ID': '1',
        'Safe Address': '0x123',
      })
    })

    it('should transform camelCase properties to Title Case', () => {
      const event: AnalyticsEvent = {
        name: 'wallet_connected',
        payload: { walletType: 'metamask', transactionHash: '0xabc' },
        context: { chainId: '1' },
      }

      provider.track(event)

      expect(mockMixpanel.mixpanelTrack).toHaveBeenCalledWith('Wallet Connected', {
        'Wallet Type': 'metamask',
        'Transaction Hash': '0xabc',
        'Chain ID': '1',
      })
    })

    it('should handle empty payload', () => {
      const event: AnalyticsEvent = {
        name: 'test_event',
        payload: {},
        context: { chainId: '1' },
      }

      provider.track(event)

      expect(mockMixpanel.mixpanelTrack).toHaveBeenCalledWith('Test Event', {
        'Chain ID': '1',
      })
    })

    it('should skip tracking when disabled', () => {
      provider.setEnabled(false)

      const event: AnalyticsEvent = {
        name: 'test_event',
        payload: { test: 'data' },
      }

      provider.track(event)

      expect(mockMixpanel.mixpanelTrack).not.toHaveBeenCalled()
    })

    it('should skip tracking when not initialized', () => {
      const uninitializedProvider = new MixpanelProvider()

      const event: AnalyticsEvent = {
        name: 'test_event',
        payload: { test: 'data' },
      }

      uninitializedProvider.track(event)

      expect(mockMixpanel.mixpanelTrack).not.toHaveBeenCalled()
    })

    it('should validate event names', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const event: AnalyticsEvent = {
        name: '', // Invalid empty name
        payload: { test: 'data' },
      }

      provider.track(event)

      expect(consoleSpy).toHaveBeenCalledWith('[Mixpanel Provider] Invalid event name:', '')
      expect(mockMixpanel.mixpanelTrack).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should handle tracking errors gracefully', () => {
      // Create a fresh provider for error testing
      const errorProvider = new MixpanelProvider<TestEvents>({ debugMode: true })
      errorProvider.init()

      mockMixpanel.mixpanelTrack.mockImplementationOnce(() => {
        throw new Error('Mixpanel Error')
      })

      const event: AnalyticsEvent = {
        name: 'test_event',
        payload: { test: 'data' },
      }

      expect(() => errorProvider.track(event)).toThrow('Mixpanel Error')
    })
  })

  describe('Event Name Normalization', () => {
    beforeEach(() => {
      // Create fresh provider and initialize for normalization tests
      provider = new MixpanelProvider<TestEvents>({ debugMode: true })
      provider.init()
      jest.clearAllMocks()
    })

    const normalizationCases = [
      { input: 'safe_created', expected: 'Safe Created' },
      { input: 'walletConnected', expected: 'Wallet Connected' },
      { input: 'transaction-confirmed', expected: 'Transaction Confirmed' },
      { input: 'SAFE_APP_LAUNCHED', expected: 'SAFE APP LAUNCHED' },
      { input: 'Custom Event Name', expected: 'Custom Event Name' },
    ]

    normalizationCases.forEach(({ input, expected }) => {
      it(`should normalize "${input}" to "${expected}" for Mixpanel`, () => {
        const event: AnalyticsEvent = {
          name: input,
          payload: { test: 'data' },
        }

        provider.track(event)

        expect(mockMixpanel.mixpanelTrack).toHaveBeenCalledWith(expected, expect.any(Object))
      })
    })
  })

  describe('Context Properties', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
    })

    it('should extract context properties correctly', () => {
      const event: AnalyticsEvent = {
        name: 'test_event',
        payload: { customProp: 'value' },
        context: {
          chainId: '1',
          safeAddress: '0x123',
          userId: 'user-456',
          source: 'web',
          device: { userAgent: 'Mozilla/5.0' },
        },
      }

      provider.track(event)

      expect(mockMixpanel.mixpanelTrack).toHaveBeenCalledWith('Test Event', {
        'Custom Prop': 'value',
        'Chain ID': '1',
        'Safe Address': '0x123',
        'User ID': 'user-456',
        Source: 'web',
        'User Agent': 'Mozilla/5.0',
      })
    })

    it('should handle missing context gracefully', () => {
      const event: AnalyticsEvent = {
        name: 'test_event',
        payload: { customProp: 'value' },
      }

      provider.track(event)

      expect(mockMixpanel.mixpanelTrack).toHaveBeenCalledWith('Test Event', {
        'Custom Prop': 'value',
      })
    })
  })

  describe('Lifecycle Methods', () => {
    it('should resolve flush immediately', async () => {
      await expect(provider.flush()).resolves.toBeUndefined()
    })

    it('should shutdown gracefully', async () => {
      provider.init()
      expect(provider.isEnabled()).toBe(true)

      await provider.shutdown()

      expect(provider.isEnabled()).toBe(false)
    })
  })
})
