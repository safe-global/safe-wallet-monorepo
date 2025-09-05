import mixpanel from 'mixpanel-browser'
import { IS_PRODUCTION, MIXPANEL_TOKEN } from '@/config/constants'
import { DeviceType } from './types'
import { MixpanelEventParams, ADDRESS_PROPERTIES, type MixpanelUserProperty } from './mixpanel-events'
import packageJson from '../../../package.json'

let isMixpanelInitialized = false

const isAddress = (key: string): boolean => ADDRESS_PROPERTIES.has(key as MixpanelEventParams | MixpanelUserProperty)

const lowercaseAddress = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === 'string' ? v.toLowerCase() : v))
  }
  if (typeof value === 'string') {
    return value.toLowerCase()
  }
  return value
}

const normalizeProperty = ([key, value]: [string, any]): [string, any] => [
  key,
  isAddress(key) ? lowercaseAddress(value) : value,
]

const normalizeProperties = (properties: Record<string, any>): Record<string, any> => {
  return Object.fromEntries(Object.entries(properties).map(normalizeProperty))
}

const safeMixpanelRegister = (properties: Record<string, any>): void => {
  if (isMixpanelInitialized) {
    mixpanel.register(normalizeProperties(properties))
  }
}

const safeMixpanelPeopleSet = (properties: Record<string, any>): void => {
  if (isMixpanelInitialized) {
    mixpanel.people.set(normalizeProperties(properties))
  }
}

const safeMixpanelTrack = (eventName: string, properties?: Record<string, any>): void => {
  if (isMixpanelInitialized) {
    mixpanel.track(eventName, properties ? normalizeProperties(properties) : undefined)
  }
}

const safeMixpanelIdentify = (userId: string): void => {
  if (isMixpanelInitialized) {
    mixpanel.identify(userId)
  }
}

export const mixpanelInit = (): void => {
  if (typeof window === 'undefined' || isMixpanelInitialized) return

  if (!MIXPANEL_TOKEN) {
    if (!IS_PRODUCTION) {
      console.warn('[Mixpanel] - No token provided')
    }
    return
  }

  try {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: !IS_PRODUCTION,
      persistence: 'localStorage',
      autocapture: false,
      batch_requests: true,
      ip: false,
      opt_out_tracking_by_default: true,
      api_host: 'https://api-eu.mixpanel.com',
    })

    isMixpanelInitialized = true

    mixpanel.register({
      [MixpanelEventParams.APP_VERSION]: packageJson.version,
      [MixpanelEventParams.DEVICE_TYPE]: DeviceType.DESKTOP,
    })

    if (!IS_PRODUCTION) {
      console.info('[Mixpanel] - Initialized (opted out by default)')
    }
  } catch (error) {
    console.error('[Mixpanel] - Initialization failed:', error)
  }
}

export const mixpanelSetBlockchainNetwork = (networkName: string): void => {
  safeMixpanelRegister({ [MixpanelEventParams.BLOCKCHAIN_NETWORK]: networkName })
}

export const mixpanelSetDeviceType = (type: DeviceType): void => {
  safeMixpanelRegister({ [MixpanelEventParams.DEVICE_TYPE]: type })
}

export const mixpanelSetSafeAddress = (safeAddress: string): void => {
  safeMixpanelRegister({ [MixpanelEventParams.SAFE_ADDRESS]: safeAddress })
}

export const mixpanelSetUserProperties = (properties: Record<string, any>): void => {
  safeMixpanelPeopleSet(properties)

  if (!IS_PRODUCTION && isMixpanelInitialized) {
    console.info('[Mixpanel] - User properties set:', properties)
  }
}

export const mixpanelSetEOAWalletLabel = (label: string): void => {
  safeMixpanelRegister({ [MixpanelEventParams.EOA_WALLET_LABEL]: label })
}

export const mixpanelSetEOAWalletAddress = (address: string): void => {
  safeMixpanelRegister({ [MixpanelEventParams.EOA_WALLET_ADDRESS]: address })
}

export const mixpanelSetEOAWalletNetwork = (network: string): void => {
  safeMixpanelRegister({ [MixpanelEventParams.EOA_WALLET_NETWORK]: network })
}

export const mixpanelTrack = (eventName: string, properties?: Record<string, any>): void => {
  safeMixpanelTrack(eventName, properties)

  if (!IS_PRODUCTION && isMixpanelInitialized) {
    console.info('[Mixpanel] - Event tracked:', eventName, properties)
  }
}

export const mixpanelIdentify = (userId: string): void => {
  const lowercaseUserId = userId.toLowerCase()
  safeMixpanelIdentify(lowercaseUserId)

  if (!IS_PRODUCTION && isMixpanelInitialized) {
    console.info('[Mixpanel] - User identified:', lowercaseUserId)
  }
}
