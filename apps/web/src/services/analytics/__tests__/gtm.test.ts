import GA from '@next/third-parties/google'
import * as gtm from '../gtm'
import { EventType, DeviceType } from '../types'

jest.mock('@next/third-parties/google', () => ({
  sendGAEvent: jest.fn(),
}))

describe('gtm', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('gtmTrack', () => {
    it('should send correct data to the dataLayer', () => {
      const mockEventData = {
        event: EventType.CLICK,
        category: 'testCategory',
        action: 'testAction',
        chainId: '1234',
        label: 'testLabel',
      }

      gtm.gtmTrack(mockEventData)

      expect(GA.sendGAEvent).toHaveBeenCalledWith(
        'event',
        'customClick',
        expect.objectContaining({
          event: mockEventData.event,
          eventCategory: mockEventData.category,
          eventAction: mockEventData.action,
          chainId: mockEventData.chainId,
          eventLabel: mockEventData.label,
          appVersion: expect.any(String),
          deviceType: DeviceType.DESKTOP,
        }),
      )
    })

    it('should set the chain ID correctly', () => {
      const testChainId = '1234'
      gtm.gtmSetChainId(testChainId)

      const mockEventData = {
        event: EventType.CLICK,
        category: 'testCategory',
        action: 'testAction',
        label: 'testLabel',
      }

      gtm.gtmTrack(mockEventData)

      expect(GA.sendGAEvent).toHaveBeenCalledWith(
        'event',
        'customClick',
        expect.objectContaining({
          event: mockEventData.event,
          eventCategory: mockEventData.category,
          eventAction: mockEventData.action,
          chainId: testChainId,
          eventLabel: mockEventData.label,
          appVersion: expect.any(String),
          deviceType: DeviceType.DESKTOP,
        }),
      )
    })
  })

  describe('gtmTrackSafeApp', () => {
    it('should send correct data to the dataLayer for a Safe App event', () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          pathname: '/apps',
        },
      })

      const mockEventData = {
        event: EventType.SAFE_APP,
        category: 'testCategory',
        action: 'testAction',
        label: 'testLabel',
        chainId: '1234',
      }

      const mockAppName = 'Test App'
      const mockSdkEventData = {
        method: 'testMethod',
        ethMethod: 'testEthMethod',
        version: '1.0.0',
      }

      gtm.gtmTrackSafeApp(mockEventData, mockAppName, mockSdkEventData)

      expect(GA.sendGAEvent).toHaveBeenCalledWith(
        'event',
        'safeAppEvent',
        expect.objectContaining({
          appVersion: expect.any(String),
          chainId: expect.any(String),
          deviceType: DeviceType.DESKTOP,
          event: EventType.SAFE_APP,
          eventAction: 'testAction',
          eventCategory: 'testCategory',
          eventLabel: 'testLabel',
          safeAddress: '',
          safeAppEthMethod: '',
          safeAppMethod: '',
          safeAppName: 'Test App',
          safeAppSDKVersion: '',
        }),
      )
    })

    describe('normalizeAppName', () => {
      const FAKE_SAFE_APP_NAME = 'Safe App'
      const FAKE_DOMAIN = 'http://domain.crypto'

      it('should return the app name if is not an URL', () => {
        expect(gtm.normalizeAppName(FAKE_SAFE_APP_NAME)).toBe(FAKE_SAFE_APP_NAME)
      })

      it('should strip the querystring or hash when is an URL', () => {
        expect(gtm.normalizeAppName(FAKE_DOMAIN)).toBe(FAKE_DOMAIN)
        expect(gtm.normalizeAppName(`${FAKE_DOMAIN}?q1=query1&q2=query2`)).toBe(FAKE_DOMAIN)
        expect(gtm.normalizeAppName(`${FAKE_DOMAIN}#hash`)).toBe(FAKE_DOMAIN)
      })
    })
  })
})
