import Cookies from 'js-cookie'

import * as gtm from '../TagManager'
import { AnalyticsUserProperties } from '../types'

const { default: TagManager } = gtm

const MOCK_ID = 'GTM-123456'
const MOCK_AUTH = 'key123'
const MOCK_PREVIEW = 'env-0'

jest.mock('js-cookie', () => ({
  remove: jest.fn(),
}))

describe('TagManager', () => {
  const originalLocation = window.location

  // Mock `location.reload`
  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: jest.fn(),
      },
    })
  })

  // Remove mock
  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
  })

  // Clear GTM between tests
  afterEach(() => {
    document.head.innerHTML = ''
    delete window.dataLayer
  })

  describe('TagManager._getScript', () => {
    it('should use the id, auth and preview', () => {
      const script1 = TagManager._getScript({ gtmId: MOCK_ID, auth: MOCK_AUTH, preview: MOCK_PREVIEW })

      expect(script1.innerHTML).toContain(MOCK_ID)
      expect(script1.innerHTML).toContain(`&gtm_auth=${MOCK_AUTH}`)
      expect(script1.innerHTML).toContain(`&gtm_preview=${MOCK_PREVIEW}`)
      expect(script1.innerHTML).toContain('dataLayer')
    })
  })

  describe('TagManager.initialize', () => {
    it('should initialize TagManager', () => {
      TagManager.initialize({ gtmId: MOCK_ID, auth: MOCK_AUTH, preview: MOCK_PREVIEW })

      expect(document.head.childNodes).toHaveLength(2)

      // Script added by `TagManager._getScript`
      // @ts-expect-error
      expect(document.head.childNodes[0].src).toBe(
        `https://www.googletagmanager.com/gtm.js?id=${MOCK_ID}&gtm_auth=${MOCK_AUTH}&gtm_preview=${MOCK_PREVIEW}&gtm_cookies_win=x`,
      )

      // Manually added script
      expect(document.head.childNodes[1]).toStrictEqual(
        TagManager._getScript({ gtmId: MOCK_ID, auth: MOCK_AUTH, preview: MOCK_PREVIEW }),
      )

      expect(window.dataLayer).toHaveLength(3)
      expect(window.dataLayer?.[0][0]).toBe('consent')
      expect(window.dataLayer?.[0][1]).toBe('default')
      expect(window.dataLayer?.[0][2]).toStrictEqual({
        ad_storage: 'denied',
        analytics_storage: 'denied',
        functionality_storage: 'granted',
        personalization_storage: 'denied',
        security_storage: 'granted',
        wait_for_update: 500,
      })
      expect(window.dataLayer?.[1]).toStrictEqual({
        'gtm.blocklist': ['j', 'jsm', 'customScripts'],
        pageLocation: 'http://localhost/balances',
        pagePath: '/balances',
      })
      expect(window.dataLayer?.[2]).toStrictEqual({ event: 'gtm.js', 'gtm.start': expect.any(Number) })
    })
  })

  describe('TagManager.dataLayer', () => {
    it('should push data to the dataLayer', () => {
      expect(window.dataLayer).toBeUndefined()

      TagManager.initialize({
        gtmId: MOCK_ID,
        auth: MOCK_AUTH,
        preview: MOCK_PREVIEW,
      })

      expect(window.dataLayer).toHaveLength(3)

      TagManager.dataLayer({
        test: '123',
      })

      expect(window.dataLayer).toHaveLength(4)
      expect(window.dataLayer?.[3]).toStrictEqual({ test: '123' })
    })
  })

  describe('TagManager.disable', () => {
    it('should remove GA cookies and reload', () => {
      TagManager.initialize({
        gtmId: MOCK_ID,
        auth: MOCK_AUTH,
        preview: MOCK_PREVIEW,
      })

      document.cookie = '_ga=GA123;'
      document.cookie = '_ga_JB9NXCRJ0G=GS123;'
      document.cookie = '_gat=GA123;'
      document.cookie = '_gid=GI123;'

      TagManager.disableCookies()

      const path = '/'
      const domain = '.localhost'

      expect(Cookies.remove).toHaveBeenCalledWith('_ga', { path, domain })
      expect(Cookies.remove).toHaveBeenCalledWith('_ga_JB9NXCRJ0G', { path, domain })
      expect(Cookies.remove).toHaveBeenCalledWith('_gat', { path, domain })
      expect(Cookies.remove).toHaveBeenCalledWith('_gid', { path, domain })

      expect(global.location.reload).toHaveBeenCalled()
    })
  })

  describe('TagManager.setUserProperty', () => {
    it('should push new user properties to dataLayer', () => {
      expect(window.dataLayer).toBeUndefined()

      TagManager.initialize({
        gtmId: MOCK_ID,
        auth: MOCK_AUTH,
        preview: MOCK_PREVIEW,
      })

      expect(window.dataLayer).toHaveLength(3)

      TagManager.setUserProperty(AnalyticsUserProperties.WALLET_LABEL, 'Superchain Account')

      expect(window.dataLayer).toHaveLength(4)

      expect(Array.from(window.dataLayer?.[3])).toEqual([
        'set',
        'user_properties',
        { [AnalyticsUserProperties.WALLET_LABEL]: 'Superchain Account' },
      ])
    })
  })
})
