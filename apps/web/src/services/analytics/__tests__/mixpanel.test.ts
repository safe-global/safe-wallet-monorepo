// Mock constants before any imports
jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  PROD_MIXPANEL_TOKEN: 'prod-token',
  STAGING_MIXPANEL_TOKEN: 'staging-token',
  MIXPANEL_TOKEN: 'staging-token',
  IS_PRODUCTION: false,
}))

import { trackEvent, trackMixpanelEvent, MixpanelEvent } from '../index'
import { mixpanelInit, mixpanelTrack, mixpanelSetSafeAddress } from '../mixpanel'
import packageJson from '../../../../package.json'

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

describe('Mixpanel Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Mixpanel initialization', () => {
    it('should initialize Mixpanel with correct configuration', () => {
      mixpanelInit()

      expect(mockMixpanel.init).toHaveBeenCalledWith('staging-token', {
        debug: true, // IS_PRODUCTION is false in tests
        persistence: 'localStorage',
        autocapture: false,
        batch_requests: true,
        ip: false,
        opt_out_tracking_by_default: true,
        api_host: 'https://api-eu.mixpanel.com',
      })

      // Should register initial params
      expect(mockMixpanel.register).toHaveBeenCalledWith({
        'App Version': packageJson.version,
        'Device Type': 'desktop',
      })
    })
  })

  describe('Event tracking', () => {
    it('should track events with Mixpanel when initialized', () => {
      mixpanelInit()

      mixpanelTrack(MixpanelEvent.SAFE_APP_LAUNCHED, {
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

      // Should NOT call Mixpanel track (only GA)
      expect(mockMixpanel.track).not.toHaveBeenCalled()
    })

    it('should track with Mixpanel only when using trackMixpanelEvent', () => {
      mixpanelInit()

      trackMixpanelEvent(MixpanelEvent.SAFE_APP_LAUNCHED, {
        'Safe App Name': 'Test App',
        'Safe App Version': '1.0.0',
      })

      // Should call Mixpanel track
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
  })
})
