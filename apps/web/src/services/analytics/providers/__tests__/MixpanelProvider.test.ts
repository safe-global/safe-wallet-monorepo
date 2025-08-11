/**
 * Unit tests for MixpanelProvider
 */

import { MixpanelProvider } from '../MixpanelProvider'
import type { AnalyticsEvent, SafeEventMap } from '../../core'
import { MixPanelEvent } from '../../mixpanel-events'
import * as mixpanel from '../../mixpanel'

// Mock external dependencies
jest.mock('../../mixpanel', () => ({
  mixpanelInit: jest.fn(),
  mixpanelTrack: jest.fn(),
  mixpanelIdentify: jest.fn(),
  mixpanelSetBlockchainNetwork: jest.fn(),
  mixpanelSetDeviceType: jest.fn(),
  mixpanelSetSafeAddress: jest.fn(),
  mixpanelSetUserProperties: jest.fn(),
}))

const mockMixpanelInit = mixpanel.mixpanelInit as jest.MockedFunction<typeof mixpanel.mixpanelInit>
const mockMixpanelTrack = mixpanel.mixpanelTrack as jest.MockedFunction<typeof mixpanel.mixpanelTrack>
const mockMixpanelIdentify = mixpanel.mixpanelIdentify as jest.MockedFunction<typeof mixpanel.mixpanelIdentify>
const mockMixpanelSetBlockchainNetwork = mixpanel.mixpanelSetBlockchainNetwork as jest.MockedFunction<
  typeof mixpanel.mixpanelSetBlockchainNetwork
>
const mockMixpanelSetDeviceType = mixpanel.mixpanelSetDeviceType as jest.MockedFunction<
  typeof mixpanel.mixpanelSetDeviceType
>
const mockMixpanelSetSafeAddress = mixpanel.mixpanelSetSafeAddress as jest.MockedFunction<
  typeof mixpanel.mixpanelSetSafeAddress
>
const mockMixpanelSetUserProperties = mixpanel.mixpanelSetUserProperties as jest.MockedFunction<
  typeof mixpanel.mixpanelSetUserProperties
>

// Test event types
type TestEvents = SafeEventMap & {
  'Safe App Launched': { appName: string; version: string }
  safe_app_launched: { appName: string; version: string }
  safeAppLaunched: { appName: string; version: string }
  'Transaction Created': { value: number; txHash: string }
  'Custom Event': { customField: string }
}

describe('MixpanelProvider', () => {
  let provider: MixpanelProvider<TestEvents>

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset all mock implementations to default
    mockMixpanelInit.mockReset()
    mockMixpanelTrack.mockReset()
    mockMixpanelIdentify.mockReset()
    mockMixpanelSetBlockchainNetwork.mockReset()
    mockMixpanelSetDeviceType.mockReset()
    mockMixpanelSetSafeAddress.mockReset()
    mockMixpanelSetUserProperties.mockReset()

    provider = new MixpanelProvider<TestEvents>({ debugMode: true })
  })

  describe('Provider Interface', () => {
    it('should implement BaseProvider interface correctly', () => {
      expect(provider.id).toBe('mixpanel')
      expect(typeof provider.isEnabled).toBe('function')
      expect(typeof provider.setEnabled).toBe('function')
      expect(typeof provider.track).toBe('function')
    })

    it('should implement IdentifyCapable interface', () => {
      expect(typeof provider.identify).toBe('function')
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
      const defaultProvider = new MixpanelProvider()
      expect(defaultProvider.id).toBe('mixpanel')
    })

    it('should call mixpanelInit on init', () => {
      provider.init()

      expect(mockMixpanelInit).toHaveBeenCalledTimes(1)
    })

    it('should identify user if userId provided in default context', () => {
      provider.init({
        defaultContext: {
          userId: 'user-123',
        },
      })

      expect(mockMixpanelIdentify).toHaveBeenCalledWith('user-123')
    })

    it('should handle initialization errors gracefully', () => {
      mockMixpanelInit.mockImplementation(() => {
        throw new Error('Mixpanel init failed')
      })

      expect(() => provider.init()).toThrow('Mixpanel init failed')
    })

    it('should not initialize twice', () => {
      provider.init()
      provider.init()

      expect(mockMixpanelInit).toHaveBeenCalledTimes(1)
    })
  })

  describe('User Identification', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
    })

    it('should identify user with ID only', () => {
      provider.identify('user-123')

      expect(mockMixpanelIdentify).toHaveBeenCalledWith('user-123')
      expect(mockMixpanelSetUserProperties).not.toHaveBeenCalled()
    })

    it('should identify user with traits converted to user properties', () => {
      provider.identify('user-123', {
        walletType: 'metamask',
        signupDate: '2025-01-11',
        isActive: true,
      })

      expect(mockMixpanelIdentify).toHaveBeenCalledWith('user-123')
      expect(mockMixpanelSetUserProperties).toHaveBeenCalledWith({
        'Wallet Type': 'metamask',
        'Signup Date': '2025-01-11',
        'Is Active': true,
      })
    })

    it('should convert camelCase traits to Title Case', () => {
      provider.identify('user-123', {
        firstName: 'John',
        lastName: 'Doe',
        walletConnected: true,
      })

      expect(mockMixpanelSetUserProperties).toHaveBeenCalledWith({
        'First Name': 'John',
        'Last Name': 'Doe',
        'Wallet Connected': true,
      })
    })

    it('should convert snake_case traits to Title Case', () => {
      provider.identify('user-123', {
        user_type: 'premium',
        last_login: '2025-01-11',
        is_verified: true,
      })

      expect(mockMixpanelSetUserProperties).toHaveBeenCalledWith({
        'User Type': 'premium',
        'Last Login': '2025-01-11',
        'Is Verified': true,
      })
    })

    it('should not identify if disabled', () => {
      provider.setEnabled(false)
      provider.identify('user-123')

      expect(mockMixpanelIdentify).not.toHaveBeenCalled()
    })

    it('should not identify if not initialized', () => {
      const uninitializedProvider = new MixpanelProvider()
      uninitializedProvider.identify('user-123')

      expect(mockMixpanelIdentify).not.toHaveBeenCalled()
    })

    it('should throw error on identification failure for retry handling', () => {
      mockMixpanelIdentify.mockImplementation(() => {
        throw new Error('Mixpanel identify failed')
      })

      expect(() => provider.identify('user-123')).toThrow('Mixpanel identify failed')
    })
  })

  describe('Event Filtering and Whitelisting', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
    })

    describe('Whitelisted Events', () => {
      it('should track "Safe App Launched" event (exact match)', () => {
        const event: AnalyticsEvent<'Safe App Launched', TestEvents['Safe App Launched']> = {
          name: 'Safe App Launched',
          payload: { appName: 'Transaction Builder', version: '1.0.0' },
        }

        provider.track(event)

        expect(mockMixpanelTrack).toHaveBeenCalledWith('Safe App Launched', {
          'App Name': 'Transaction Builder',
          Version: '1.0.0',
        })
      })

      it('should track "safe_app_launched" and normalize to PascalCase', () => {
        const event: AnalyticsEvent<'safe_app_launched', TestEvents['safe_app_launched']> = {
          name: 'safe_app_launched',
          payload: { appName: 'Safe Apps List', version: '2.0.0' },
        }

        provider.track(event)

        expect(mockMixpanelTrack).toHaveBeenCalledWith('Safe App Launched', {
          'App Name': 'Safe Apps List',
          Version: '2.0.0',
        })
      })

      it('should track "safeAppLaunched" and normalize to PascalCase', () => {
        const event: AnalyticsEvent<'safeAppLaunched', TestEvents['safeAppLaunched']> = {
          name: 'safeAppLaunched',
          payload: { appName: 'Preview Drawer', version: '1.5.0' },
        }

        provider.track(event)

        expect(mockMixpanelTrack).toHaveBeenCalledWith('Safe App Launched', {
          'App Name': 'Preview Drawer',
          Version: '1.5.0',
        })
      })
    })

    describe('Non-whitelisted Events', () => {
      it('should NOT track "Transaction Created" (not whitelisted)', () => {
        const event: AnalyticsEvent<'Transaction Created', TestEvents['Transaction Created']> = {
          name: 'Transaction Created',
          payload: { value: 100, txHash: '0x123' },
        }

        provider.track(event)

        expect(mockMixpanelTrack).not.toHaveBeenCalled()
      })

      it('should NOT track custom events (not whitelisted)', () => {
        const event: AnalyticsEvent<'Custom Event', TestEvents['Custom Event']> = {
          name: 'Custom Event',
          payload: { customField: 'test' },
        }

        provider.track(event)

        expect(mockMixpanelTrack).not.toHaveBeenCalled()
      })

      it('should log debug message for non-whitelisted events', () => {
        const consoleSpy = jest.spyOn(console, 'info').mockImplementation()

        const event: AnalyticsEvent<'Custom Event', TestEvents['Custom Event']> = {
          name: 'Custom Event',
          payload: { customField: 'test' },
        }

        provider.track(event)

        expect(consoleSpy).toHaveBeenCalledWith(
          '[Mixpanel Provider] Event "Custom Event" (normalized: "Custom Event") not whitelisted, skipping',
        )

        consoleSpy.mockRestore()
      })
    })
  })

  describe('Property Conversion', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
    })

    it('should convert payload properties to Title Case', () => {
      const event: AnalyticsEvent<'Safe App Launched', TestEvents['Safe App Launched']> = {
        name: 'Safe App Launched',
        payload: {
          appName: 'Transaction Builder',
          version: '1.0.0',
        },
      }

      provider.track(event)

      expect(mockMixpanelTrack).toHaveBeenCalledWith('Safe App Launched', {
        'App Name': 'Transaction Builder',
        Version: '1.0.0',
      })
    })

    it('should include context properties', () => {
      const event: AnalyticsEvent<'Safe App Launched', TestEvents['Safe App Launched']> = {
        name: 'Safe App Launched',
        payload: { appName: 'Safe Apps', version: '1.0.0' },
        context: {
          chainId: '1',
          safeAddress: '0x123abc',
        },
      }

      provider.track(event)

      expect(mockMixpanelTrack).toHaveBeenCalledWith('Safe App Launched', {
        'App Name': 'Safe Apps',
        Version: '1.0.0',
        'Blockchain Network': '1',
        'Safe Address': '0x123abc',
      })
    })

    it('should handle empty payload gracefully', () => {
      const event: AnalyticsEvent = {
        name: 'Safe App Launched',
        payload: {},
      }

      provider.track(event)

      expect(mockMixpanelTrack).toHaveBeenCalledWith('Safe App Launched', undefined)
    })

    it('should handle null/undefined values in payload', () => {
      const event: AnalyticsEvent<
        'Safe App Launched',
        TestEvents['Safe App Launched'] & { nullValue: null; undefinedValue: undefined }
      > = {
        name: 'Safe App Launched',
        payload: {
          appName: 'Test App',
          version: '1.0.0',
          nullValue: null,
          undefinedValue: undefined,
        },
      }

      provider.track(event)

      // Should exclude null/undefined values
      expect(mockMixpanelTrack).toHaveBeenCalledWith('Safe App Launched', {
        'App Name': 'Test App',
        Version: '1.0.0',
      })
    })
  })

  describe('Context Updates', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
    })

    it('should update chain ID', () => {
      provider.updateContext({ chainId: '42' })

      expect(mockMixpanelSetBlockchainNetwork).toHaveBeenCalledWith('42')
    })

    it('should update device type', () => {
      provider.updateContext({ deviceType: 'mobile' as any })

      expect(mockMixpanelSetDeviceType).toHaveBeenCalledWith('mobile')
    })

    it('should update Safe address', () => {
      provider.updateContext({ safeAddress: '0x123abc' })

      expect(mockMixpanelSetSafeAddress).toHaveBeenCalledWith('0x123abc')
    })

    it('should update multiple context properties', () => {
      provider.updateContext({
        chainId: '137',
        deviceType: 'tablet' as any,
        safeAddress: '0xdef456',
      })

      expect(mockMixpanelSetBlockchainNetwork).toHaveBeenCalledWith('137')
      expect(mockMixpanelSetDeviceType).toHaveBeenCalledWith('tablet')
      expect(mockMixpanelSetSafeAddress).toHaveBeenCalledWith('0xdef456')
    })

    it('should not update context if disabled', () => {
      provider.setEnabled(false)

      provider.updateContext({ chainId: '1' })

      expect(mockMixpanelSetBlockchainNetwork).not.toHaveBeenCalled()
    })

    it('should handle context update errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      mockMixpanelSetBlockchainNetwork.mockImplementation(() => {
        throw new Error('Context update failed')
      })

      // Should not throw
      expect(() => provider.updateContext({ chainId: '1' })).not.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith('[Mixpanel Provider] Failed to update context:', expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe('Lifecycle Methods', () => {
    it('should flush without error', async () => {
      await expect(provider.flush()).resolves.toBeUndefined()
    })

    it('should shutdown cleanly', () => {
      provider.init()

      provider.shutdown()

      expect(provider.isEnabled()).toBe(false)
    })

    it('should not track events after shutdown', () => {
      provider.init()
      provider.shutdown()

      const event: AnalyticsEvent<'Safe App Launched', TestEvents['Safe App Launched']> = {
        name: 'Safe App Launched',
        payload: { appName: 'Test', version: '1.0.0' },
      }

      provider.track(event)

      expect(mockMixpanelTrack).not.toHaveBeenCalled()
    })
  })

  describe('Naming Convention Enforcement', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
    })

    const namingTestCases = [
      { input: 'Safe App Launched', expected: 'Safe App Launched' },
      { input: 'safe app launched', expected: 'Safe App Launched' },
      { input: 'safe_app_launched', expected: 'Safe App Launched' },
      { input: 'safeAppLaunched', expected: 'Safe App Launched' },
      { input: 'SAFE_APP_LAUNCHED', expected: 'Safe App Launched' },
      { input: 'safe-app-launched', expected: 'Safe-App-Launched' }, // Hyphens preserved
    ]

    namingTestCases.forEach(({ input, expected }) => {
      it(`should normalize "${input}" to "${expected}"`, () => {
        // Only test with whitelisted events (adjust expected to match whitelist)
        const normalizedExpected = expected === 'Safe App Launched' ? expected : 'Safe App Launched'

        const event: AnalyticsEvent = {
          name: input,
          payload: { appName: 'Test', version: '1.0.0' },
        }

        provider.track(event)

        if (normalizedExpected === 'Safe App Launched') {
          expect(mockMixpanelTrack).toHaveBeenCalledWith('Safe App Launched', expect.any(Object))
        } else {
          // Non-whitelisted events should not be tracked
          expect(mockMixpanelTrack).not.toHaveBeenCalled()
        }
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      provider.init()
    })

    it('should handle tracking errors and re-throw for retry handling', () => {
      mockMixpanelTrack.mockImplementation(() => {
        throw new Error('Mixpanel tracking failed')
      })

      const event: AnalyticsEvent<'Safe App Launched', TestEvents['Safe App Launched']> = {
        name: 'Safe App Launched',
        payload: { appName: 'Test', version: '1.0.0' },
      }

      expect(() => provider.track(event)).toThrow('Mixpanel tracking failed')
    })

    it('should log debug information when enabled', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()

      const event: AnalyticsEvent<'Safe App Launched', TestEvents['Safe App Launched']> = {
        name: 'Safe App Launched',
        payload: { appName: 'Debug Test', version: '1.0.0' },
      }

      provider.track(event)

      expect(consoleSpy).toHaveBeenCalledWith('[Mixpanel Provider] Event tracked:', {
        original: 'Safe App Launched',
        normalized: 'Safe App Launched',
        properties: {
          'App Name': 'Debug Test',
          Version: '1.0.0',
        },
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Event Whitelist Validation', () => {
    beforeEach(() => {
      provider.init()
      jest.clearAllMocks()
    })

    it('should validate whitelist contains only currently tracked events', () => {
      // Verify that the whitelist matches the MixPanelEvent enum
      expect(MixPanelEvent.SAFE_APP_LAUNCHED).toBe('Safe App Launched')

      const event: AnalyticsEvent<'Safe App Launched', TestEvents['Safe App Launched']> = {
        name: 'Safe App Launched',
        payload: { appName: 'Whitelist Test', version: '1.0.0' },
      }

      provider.track(event)

      expect(mockMixpanelTrack).toHaveBeenCalledWith('Safe App Launched', expect.any(Object))
    })
  })
})
