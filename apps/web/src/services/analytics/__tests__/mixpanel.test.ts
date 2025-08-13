// Mock constants before any imports
jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  MIXPANEL_TOKEN: 'test-token',
  IS_PRODUCTION: false,
}))

import {
  trackEvent,
  trackMixPanelEvent,
  MixPanelEvent,
  safeAppToMixPanelEventProperties,
  SafeAppLaunchLocation,
} from '../index'
import { mixpanelInit, mixpanelTrack, mixpanelSetSafeAddress } from '../mixpanel'

// Mock GTM
jest.mock('../gtm', () => ({
  gtmTrack: jest.fn(),
  gtmTrackSafeApp: jest.fn(),
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

const mockMixpanel = jest.requireMock('mixpanel-browser')
const mockGtm = jest.requireMock('../gtm')

describe('MixPanel Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('MixPanel initialization', () => {
    it('should initialize MixPanel with correct configuration', () => {
      mixpanelInit()

      expect(mockMixpanel.init).toHaveBeenCalledWith('test-token', {
        debug: true, // IS_PRODUCTION is false in tests
        persistence: 'localStorage',
        autocapture: false,
        batch_requests: true,
        ip: false,
        opt_out_tracking_by_default: true,
      })

      // Should register initial params
      expect(mockMixpanel.register).toHaveBeenCalledWith({
        'App Version': packageJson.version,
        'Device Type': 'desktop',
      })
    })
  })

  describe('Event tracking', () => {
    it('should track events with MixPanel when initialized', () => {
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
      mixpanelInit()

      const testAddress = '0x1234567890abcdef1234567890abcdef12345678'
      mixpanelSetSafeAddress(testAddress)

      expect(mockMixpanel.register).toHaveBeenCalledWith({
        'Safe Address': testAddress,
      })
    })

    it('should handle safe address without 0x prefix', () => {
      mixpanelInit()

      const testAddress = '1234567890abcdef1234567890abcdef12345678'
      mixpanelSetSafeAddress(testAddress)

      expect(mockMixpanel.register).toHaveBeenCalledWith({
        'Safe Address': testAddress,
      })
    })
  })

  describe('Separate tracking', () => {
    it('should track with GA only when using trackEvent', () => {
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

      // Should NOT call GA track
      expect(mockGtm.gtmTrack).not.toHaveBeenCalled()
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

  describe('Token selection based on environment', () => {
    beforeEach(() => {
      jest.resetModules()
      jest.clearAllMocks()
    })

    it('should use production token when IS_PRODUCTION is true', () => {
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()

      jest.isolateModules(() => {
        // Clear all mocks first
        jest.unmock('@/config/constants')
        jest.unmock('../mixpanel')

        // Mock mixpanel-browser
        jest.doMock('mixpanel-browser', () => ({
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

        jest.doMock('@/config/constants', () => ({
          IS_PRODUCTION: true,
          PROD_MIXPANEL_TOKEN: 'prod-token-12345',
          TEST_MIXPANEL_TOKEN: 'test-token-67890',
          MIXPANEL_TOKEN: 'prod-token-12345', // Should use prod token
        }))

        const { mixpanelInit } = require('../mixpanel')
        const mockMixpanelLocal = require('mixpanel-browser')

        mixpanelInit()

        expect(mockMixpanelLocal.init).toHaveBeenCalledWith(
          'prod-token-12345',
          expect.objectContaining({
            debug: false, // IS_PRODUCTION is true
            opt_out_tracking_by_default: true,
          }),
        )
      })

      consoleInfoSpy.mockRestore()
    })

    it('should use test token when IS_PRODUCTION is false', () => {
      const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation()

      jest.isolateModules(() => {
        // Clear all mocks first
        jest.unmock('@/config/constants')
        jest.unmock('../mixpanel')

        // Mock mixpanel-browser
        jest.doMock('mixpanel-browser', () => ({
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

        jest.doMock('@/config/constants', () => ({
          IS_PRODUCTION: false,
          PROD_MIXPANEL_TOKEN: 'prod-token-12345',
          TEST_MIXPANEL_TOKEN: 'test-token-67890',
          MIXPANEL_TOKEN: 'test-token-67890', // Should use test token
        }))

        const { mixpanelInit } = require('../mixpanel')
        const mockMixpanelLocal = require('mixpanel-browser')

        mixpanelInit()

        expect(mockMixpanelLocal.init).toHaveBeenCalledWith(
          'test-token-67890',
          expect.objectContaining({
            debug: true, // IS_PRODUCTION is false
            opt_out_tracking_by_default: true,
          }),
        )
      })

      consoleInfoSpy.mockRestore()
    })
  })
})
