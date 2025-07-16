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
import { MixPanelEventParams } from './mixpanel-events'
import packageJson from '../../../package.json'

const commonEventParams = {
  [MixPanelEventParams.APP_VERSION]: packageJson.version,
  [MixPanelEventParams.BLOCKCHAIN_NETWORK]: '',
  [MixPanelEventParams.DEVICE_TYPE]: DeviceType.DESKTOP,
  [MixPanelEventParams.SAFE_ADDRESS]: '',
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
 * Set blockchain network for all MixPanel events
 */
export const mixpanelSetBlockchainNetwork = (networkName: string): void => {
  commonEventParams[MixPanelEventParams.BLOCKCHAIN_NETWORK] = networkName

  if (isMixPanelInitialized) {
    mixpanel.register({ [MixPanelEventParams.BLOCKCHAIN_NETWORK]: networkName })
  }
}

/**
 * Set device type for all MixPanel events
 */
export const mixpanelSetDeviceType = (type: DeviceType): void => {
  commonEventParams[MixPanelEventParams.DEVICE_TYPE] = type

  if (isMixPanelInitialized) {
    mixpanel.register({ [MixPanelEventParams.DEVICE_TYPE]: type })
  }
}

/**
 * Set safe address for all MixPanel events
 */
export const mixpanelSetSafeAddress = (safeAddress: string): void => {
  commonEventParams[MixPanelEventParams.SAFE_ADDRESS] = safeAddress

  if (isMixPanelInitialized) {
    mixpanel.register({ [MixPanelEventParams.SAFE_ADDRESS]: commonEventParams[MixPanelEventParams.SAFE_ADDRESS] })
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
 * Set user properties (single property or multiple properties)
 */
export const mixpanelSetUserProperties = (properties: Record<string, any> | string, value?: any): void => {
  if (!isMixPanelInitialized) return

  let props: Record<string, any>

  if (typeof properties === 'string') {
    // Single property usage: mixpanelSetUserProperties('key', 'value')
    props = { [properties]: value }
  } else {
    // Multiple properties usage: mixpanelSetUserProperties({ key1: 'value1', key2: 'value2' })
    props = properties
  }

  mixpanel.people.set(props)

  if (!IS_PRODUCTION) {
    console.info('[MixPanel] - User properties set:', props)
  }
}

/**
 * Union values to a list property (append without duplicates)
 */
export const mixpanelUnionUserProperty = (property: string, values: string[]): void => {
  if (!isMixPanelInitialized) return

  mixpanel.people.union({ [property]: values })

  if (!IS_PRODUCTION) {
    console.info('[MixPanel] - User property union:', property, 'with', values)
  }
}

/**
 * Convert SafeApp object to MixPanel event properties
 */
export const safeAppToMixPanelEventProperties = (
  safeApp: SafeAppData,
  options?: {
    launchLocation?: string
    chainName?: string
  },
): Record<string, any> => {
  const properties: Record<string, any> = {
    'Safe App Name': safeApp.name,
    'Safe App Tags': safeApp.tags,
  }

  if (options?.launchLocation) {
    properties['Launch Location'] = options.launchLocation
  }

  if (options?.chainName) {
    properties[MixPanelEventParams.BLOCKCHAIN_NETWORK] = options.chainName
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
