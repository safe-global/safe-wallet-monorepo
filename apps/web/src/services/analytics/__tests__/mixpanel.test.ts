import {
  trackEvent,
  trackMixPanelEvent,
  MixPanelEvent,
  safeAppToMixPanelEventProperties,
  SafeAppLaunchLocation,
} from '../index'

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

const mockMixpanel = jest.requireMock('mixpanel-browser')

describe('MixPanel Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock environment variable
    process.env.NEXT_PUBLIC_MIXPANEL_TOKEN = 'test-token'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  })

  describe('MixPanel initialization', () => {
    it('should initialize MixPanel with correct configuration', () => {
      const { mixpanelInit } = require('../mixpanel')

      mixpanelInit()

      expect(mockMixpanel.init).toHaveBeenCalledWith('test-token', {
        debug: true, // IS_PRODUCTION is false in tests
        persistence: 'localStorage',
        autocapture: false,
        batch_requests: true,
        opt_out_tracking_by_default: true,
        ip: false,
      })
    })

    it('should not initialize if no token is provided', () => {
      delete process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
      const { mixpanelInit } = require('../mixpanel')

      mixpanelInit()

      expect(mockMixpanel.init).not.toHaveBeenCalled()
    })
  })

  describe('Event tracking', () => {
    it('should track events with MixPanel when initialized', () => {
      const { mixpanelInit, mixpanelTrack } = require('../mixpanel')

      mixpanelInit()

      mixpanelTrack(MixPanelEvent.SAFE_APP_LAUNCHED, {
        'Safe App Name': 'Test App',
        'Custom Property': 'value',
      })

      expect(mockMixpanel.track).toHaveBeenCalledWith(
        'Safe App Launched',
        expect.objectContaining({
          'Safe App Name': 'Test App',
          'Custom Property': 'value',
        }),
      )
    })
  })

  describe('Safe address handling', () => {
    it('should set safe address without removing 0x prefix', () => {
      const { mixpanelInit, mixpanelSetSafeAddress } = require('../mixpanel')

      mixpanelInit()

      const testAddress = '0x1234567890abcdef1234567890abcdef12345678'
      mixpanelSetSafeAddress(testAddress)

      expect(mockMixpanel.register).toHaveBeenCalledWith({
        'Safe Address': testAddress,
      })
    })

    it('should handle safe address without 0x prefix', () => {
      const { mixpanelInit, mixpanelSetSafeAddress } = require('../mixpanel')

      mixpanelInit()

      const testAddress = '1234567890abcdef1234567890abcdef12345678'
      mixpanelSetSafeAddress(testAddress)

      expect(mockMixpanel.register).toHaveBeenCalledWith({
        'Safe Address': testAddress,
      })
    })
  })

  describe('User property operations', () => {
    it('should union values to a list property', () => {
      const { mixpanelInit, mixpanelUnionUserProperty } = require('../mixpanel')
      mixpanelInit()

      mixpanelUnionUserProperty('Networks', ['ethereum', 'polygon'])

      expect(mockMixpanel.people.union).toHaveBeenCalledWith('Networks', ['ethereum', 'polygon'])
    })
  })

  describe('Separate tracking', () => {
    it('should track with GA only when using trackEvent', () => {
      const { mixpanelInit } = require('../mixpanel')

      mixpanelInit()

      const eventData = {
        category: 'test',
        action: 'click',
      }

      trackEvent(eventData)

      // Should NOT call MixPanel track (only GA)
      expect(mockMixpanel.track).not.toHaveBeenCalled()
    })

    it('should track with MixPanel only when using trackMixPanelEvent', () => {
      const { mixpanelInit } = require('../mixpanel')

      mixpanelInit()

      trackMixPanelEvent(MixPanelEvent.SAFE_APP_LAUNCHED, {
        'Safe App Name': 'Test App',
        'Safe App Version': '1.0.0',
      })

      // Should call MixPanel track
      expect(mockMixpanel.track).toHaveBeenCalledWith(
        'Safe App Launched',
        expect.objectContaining({
          'Safe App Name': 'Test App',
          'Safe App Version': '1.0.0',
        }),
      )
    })

    it('should convert SafeApp to MixPanel properties', () => {
      const mockSafeApp = {
        id: 123,
        name: 'Test App',
        url: 'https://test-app.com',
        description: 'A test app',
        iconUrl: 'https://test-app.com/icon.png',
        developerWebsite: 'https://developer.com',
        chainIds: ['1', '5'],
        socialProfiles: [],
        tags: ['defi', 'swap'],
        accessControl: { type: 'NO_RESTRICTIONS' as const },
        features: [],
      }

      const properties = safeAppToMixPanelEventProperties(mockSafeApp as any)

      expect(properties).toEqual({
        'Safe App Name': 'Test App',
        'Safe App Tags': ['defi', 'swap'],
      })
    })

    it('should convert SafeApp to MixPanel properties with launch location', () => {
      const mockSafeApp = {
        id: 123,
        name: 'Test App',
        url: 'https://test-app.com',
        description: 'A test app',
        iconUrl: 'https://test-app.com/icon.png',
        developerWebsite: 'https://developer.com',
        chainIds: ['1', '5'],
        socialProfiles: [],
        tags: ['defi', 'swap'],
        accessControl: { type: 'NO_RESTRICTIONS' as const },
        features: [],
      }

      const properties = safeAppToMixPanelEventProperties(mockSafeApp as any, {
        launchLocation: SafeAppLaunchLocation.PREVIEW_DRAWER,
      })

      expect(properties).toEqual({
        'Safe App Name': 'Test App',
        'Safe App Tags': ['defi', 'swap'],
        'Launch Location': 'Preview Drawer',
      })
    })

    it('should convert SafeApp to MixPanel properties with Safe App List launch location', () => {
      const mockSafeApp = {
        id: 123,
        name: 'Test App',
        url: 'https://test-app.com',
        description: 'A test app',
        iconUrl: 'https://test-app.com/icon.png',
        developerWebsite: 'https://developer.com',
        chainIds: ['1', '5'],
        socialProfiles: [],
        tags: ['defi', 'swap'],
        accessControl: { type: 'NO_RESTRICTIONS' as const },
        features: [],
      }

      const properties = safeAppToMixPanelEventProperties(mockSafeApp as any, {
        launchLocation: SafeAppLaunchLocation.SAFE_APPS_LIST,
      })

      expect(properties).toEqual({
        'Safe App Name': 'Test App',
        'Safe App Tags': ['defi', 'swap'],
        'Launch Location': 'Safe Apps List',
      })
    })
  })
})
