/**
 * MixPanel-related functions.
 *
 * Initializes MixPanel and provides event tracking functions.
 * This service mirrors the GTM implementation for consistency.
 *
 * This service should NOT be used directly by components. Use the `analytics` service instead.
 */

import mixpanel from 'mixpanel-browser'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import { IS_PRODUCTION } from '@/config/constants'
import { DeviceType } from './types'
import packageJson from '../../../package.json'

const commonEventParams = {
  'App Version': packageJson.version,
  'Chain ID': '',
  'Device Type': DeviceType.DESKTOP,
  'Safe Address': '',
}

let isMixPanelInitialized = false

/**
 * Initialize MixPanel
 */
export const mixpanelInit = (): void => {
  if (typeof window === 'undefined' || isMixPanelInitialized) return

  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  if (!token) {
    if (!IS_PRODUCTION) {
      console.warn('[MixPanel] - No token provided')
    }
    return
  }

  try {
    mixpanel.init(token, {
      debug: !IS_PRODUCTION,
      persistence: 'localStorage',
      autocapture: false,
      batch_requests: true,
      opt_out_tracking_by_default: true,
    })

    isMixPanelInitialized = true

    if (!IS_PRODUCTION) {
      console.info('[MixPanel] - Initialized')
    }
  } catch (error) {
    console.error('[MixPanel] - Initialization failed:', error)
  }
}

/**
 * Set chain ID for all MixPanel events
 */
export const mixpanelSetChainId = (chainId: string): void => {
  commonEventParams['Chain ID'] = chainId

  if (isMixPanelInitialized) {
    mixpanel.register({ 'Chain ID': chainId })
  }
}

/**
 * Set device type for all MixPanel events
 */
export const mixpanelSetDeviceType = (type: DeviceType): void => {
  commonEventParams['Device Type'] = type

  if (isMixPanelInitialized) {
    mixpanel.register({ 'Device Type': type })
  }
}

/**
 * Set safe address for all MixPanel events
 */
export const mixpanelSetSafeAddress = (safeAddress: string): void => {
  commonEventParams['Safe Address'] = safeAddress

  if (isMixPanelInitialized) {
    mixpanel.register({ 'Safe Address': commonEventParams['Safe Address'] })
  }
}

/**
 * Enable MixPanel tracking (opt-in)
 */
export const mixpanelEnableTracking = (): void => {
  if (!isMixPanelInitialized) return

  mixpanel.opt_in_tracking()

  if (!IS_PRODUCTION) {
    console.info('[MixPanel] - Tracking enabled')
  }
}

/**
 * Disable MixPanel tracking (opt-out)
 */
export const mixpanelDisableTracking = (): void => {
  if (!isMixPanelInitialized) return

  mixpanel.opt_out_tracking()
  mixpanel.reset()

  if (!IS_PRODUCTION) {
    console.info('[MixPanel] - Tracking disabled')
  }
}

/**
 * Set user properties
 */
export const mixpanelSetUserProperty = (name: string, value: string): void => {
  if (!isMixPanelInitialized) return

  mixpanel.people.set({ [name]: value })

  if (!IS_PRODUCTION) {
    console.info('[MixPanel] - User property set:', name, '=', value)
  }
}

/**
 * Convert SafeApp object to MixPanel event properties
 */
export const safeAppToMixPanelEventProperties = (
  safeApp: SafeAppData,
  launchLocation?: string,
): Record<string, any> => {
  const properties: Record<string, any> = {
    'Safe App Name': safeApp.name,
    'Safe App ID': safeApp.id,
    'Safe App Tags': safeApp.tags,
  }

  if (launchLocation) {
    properties['Launch Location'] = launchLocation
  }

  return properties
}

/**
 * Track event with MixPanel
 */
export const mixpanelTrack = (eventName: string, properties?: Record<string, any>): void => {
  if (!isMixPanelInitialized) return

  const eventProperties: Record<string, any> = {
    ...commonEventParams,
    ...properties,
  }

  mixpanel.track(eventName, eventProperties)

  if (!IS_PRODUCTION) {
    console.info('[MixPanel] - Event tracked:', eventName, eventProperties)
  }
}

/**
 * Identify user in MixPanel
 */
export const mixpanelIdentify = (userId: string): void => {
  if (!isMixPanelInitialized) return

  mixpanel.identify(userId)

  if (!IS_PRODUCTION) {
    console.info('[MixPanel] - User identified:', userId)
  }
}

/**
 * Check if MixPanel is initialized
 */
export const isMixPanelReady = (): boolean => {
  return isMixPanelInitialized
}
