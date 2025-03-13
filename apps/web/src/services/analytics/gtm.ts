/**
 * Google Tag Manager-related functions.
 *
 * Initializes and un-initializes GTM in production or dev mode.
 * Allows sending datalayer events to GTM.
 *
 * This service should NOT be used directly by components. Use the `analytics` service instead.
 */

import { sendGAEvent } from '@next/third-parties/google'
import Cookies from 'js-cookie'
import { SAFE_APPS_GA_TRACKING_ID, GA_TRACKING_ID, IS_PRODUCTION } from '@/config/constants'
import type { AnalyticsEvent, EventLabel, SafeAppSDKEvent } from './types'
import { EventType, DeviceType } from './types'
import { SAFE_APPS_SDK_CATEGORY } from './events'
import { getAbTest } from '../tracking/abTesting'
import type { AbTest } from '../tracking/abTesting'
import { AppRoutes } from '@/config/routes'
import packageJson from '../../../package.json'

const commonEventParams = {
  appVersion: packageJson.version,
  chainId: '',
  deviceType: DeviceType.DESKTOP,
  safeAddress: '',
}

export const gtmSetChainId = (chainId: string): void => {
  commonEventParams.chainId = chainId
}

export const gtmSetDeviceType = (type: DeviceType): void => {
  commonEventParams.deviceType = type
}

export const gtmSetSafeAddress = (safeAddress: string): void => {
  commonEventParams.safeAddress = safeAddress.slice(2) // Remove 0x prefix
}

export const gtmEnableCookies = () => {
  window.gtag?.('consent', 'update', {
    analytics_storage: 'granted',
  })
}

export const gtmDisableCookies = () => {
  window.gtag?.('consent', 'update', {
    analytics_storage: 'denied',
  })

  const GA_COOKIE_LIST = ['_ga', '_gat', '_gid']
  const GA_PREFIX = '_ga_'
  const allCookies = document.cookie.split(';').map((cookie) => cookie.split('=')[0].trim())
  const gaCookies = allCookies.filter((cookie) => cookie.startsWith(GA_PREFIX))

  GA_COOKIE_LIST.concat(gaCookies).forEach((cookie) => {
    Cookies.remove(cookie, {
      path: '/',
      domain: `.${location.host.split('.').slice(-2).join('.')}`,
    })
  })

  // Injected script will remain in memory until new session
  location.reload()
}

export const gtmSetUserProperty = (name: string, value: string) => {
  window.gtag?.('set', 'user_properties', {
    [name]: value,
  })

  if (!IS_PRODUCTION) {
    console.info('[GTM] -', 'set user_properties', name, '=', value)
  }
}

type GtmEvent = {
  event: EventType
  chainId: string
  deviceType: DeviceType
  abTest?: AbTest
}

type ActionGtmEvent = GtmEvent & {
  eventCategory: string
  eventAction: string
  send_to: string
  eventLabel?: EventLabel
  eventType?: string
}

type PageviewGtmEvent = GtmEvent & {
  page_location: string
  page_path: string
  send_to: string
}

type SafeAppGtmEvent = ActionGtmEvent & {
  safeAppName: string
  safeAppMethod?: string
  safeAppEthMethod?: string
  safeAppSDKVersion?: string
  send_to: string
}

export const gtmTrack = (eventData: AnalyticsEvent): void => {
  const gtmEvent: ActionGtmEvent = {
    ...commonEventParams,
    event: eventData.event || EventType.CLICK,
    eventCategory: eventData.category,
    eventAction: eventData.action,
    chainId: eventData.chainId || commonEventParams.chainId,
    send_to: GA_TRACKING_ID,
  }

  if (eventData.event) {
    gtmEvent.eventType = eventData.event
  } else {
    gtmEvent.eventType = undefined
  }

  if (eventData.label !== undefined) {
    gtmEvent.eventLabel = eventData.label
  } else {
    // Otherwise, whatever was in the datalayer before will be reused
    gtmEvent.eventLabel = undefined
  }

  const abTest = getAbTest()

  if (abTest) {
    gtmEvent.abTest = abTest
  }

  sendEvent(gtmEvent.event, gtmEvent)
}

export const gtmTrackPageview = (pagePath: string, pathWithQuery: string): void => {
  const gtmEvent: PageviewGtmEvent = {
    ...commonEventParams,
    event: EventType.PAGEVIEW,
    page_location: `${location.origin}${pathWithQuery}`,
    page_path: pagePath,
    send_to: GA_TRACKING_ID,
  }

  sendEvent('page_view', gtmEvent)
}

export const normalizeAppName = (appName?: string): string => {
  // App name is a URL
  if (appName?.startsWith('http')) {
    // Strip search query and hash
    return appName.split('?')[0].split('#')[0]
  }
  return appName || ''
}

export const gtmTrackSafeApp = (eventData: AnalyticsEvent, appName?: string, sdkEventData?: SafeAppSDKEvent): void => {
  if (!location.pathname.startsWith(AppRoutes.apps.index) && !eventData.label) {
    return
  }

  const safeAppGtmEvent: SafeAppGtmEvent = {
    ...commonEventParams,
    event: EventType.SAFE_APP,
    eventCategory: eventData.category,
    eventAction: eventData.action,
    safeAppName: normalizeAppName(appName),
    safeAppEthMethod: '',
    safeAppMethod: '',
    safeAppSDKVersion: '',
    send_to: SAFE_APPS_GA_TRACKING_ID,
  }

  if (eventData.category === SAFE_APPS_SDK_CATEGORY) {
    safeAppGtmEvent.safeAppMethod = sdkEventData?.method
    safeAppGtmEvent.safeAppEthMethod = sdkEventData?.ethMethod
    safeAppGtmEvent.safeAppSDKVersion = sdkEventData?.version
  }

  if (eventData.label) {
    safeAppGtmEvent.eventLabel = eventData.label
  }

  sendEvent('safeAppEvent', safeAppGtmEvent)
}

const sendEvent = (eventName: string, data: object) => {
  sendGAEvent('event', eventName, data)

  if (!IS_PRODUCTION) {
    console.info('[GA] -', data)
  }
}
