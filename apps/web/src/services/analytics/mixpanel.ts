import mixpanel from 'mixpanel-browser'
import { IS_PRODUCTION, MIXPANEL_TOKEN } from '@/config/constants'
import { DeviceType } from './types'
import { MixPanelEventParams, ADDRESS_PROPERTIES, type MixPanelUserProperty } from './mixpanel-events'
import packageJson from '../../../package.json'

let isMixPanelInitialized = false

const isAddress = (key: string): boolean => ADDRESS_PROPERTIES.has(key as MixPanelEventParams | MixPanelUserProperty)

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

const safeMixPanelRegister = (properties: Record<string, any>): void => {
  if (isMixPanelInitialized) {
    mixpanel.register(normalizeProperties(properties))
  }
}

const safeMixPanelPeopleSet = (properties: Record<string, any>): void => {
  if (isMixPanelInitialized) {
    mixpanel.people.set(normalizeProperties(properties))
  }
}

const safeMixPanelTrack = (eventName: string, properties?: Record<string, any>): void => {
  if (isMixPanelInitialized) {
    mixpanel.track(eventName, properties ? normalizeProperties(properties) : undefined)
  }
}

const safeMixPanelIdentify = (userId: string): void => {
  if (isMixPanelInitialized) {
    mixpanel.identify(userId)
  }
}

export const mixpanelInit = (): void => {
  if (typeof window === 'undefined' || isMixPanelInitialized) return

  if (!MIXPANEL_TOKEN) {
    if (!IS_PRODUCTION) {
      console.warn('[MixPanel] - No token provided')
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
    })

    isMixPanelInitialized = true

    mixpanel.register({
      [MixPanelEventParams.APP_VERSION]: packageJson.version,
      [MixPanelEventParams.DEVICE_TYPE]: DeviceType.DESKTOP,
    })

    if (!IS_PRODUCTION) {
      console.info('[MixPanel] - Initialized (opted out by default)')
    }
  } catch (error) {
    console.error('[MixPanel] - Initialization failed:', error)
  }
}

export const mixpanelSetBlockchainNetwork = (networkName: string): void => {
  safeMixPanelRegister({ [MixPanelEventParams.BLOCKCHAIN_NETWORK]: networkName })
}

export const mixpanelSetDeviceType = (type: DeviceType): void => {
  safeMixPanelRegister({ [MixPanelEventParams.DEVICE_TYPE]: type })
}

export const mixpanelSetSafeAddress = (safeAddress: string): void => {
  safeMixPanelRegister({ [MixPanelEventParams.SAFE_ADDRESS]: safeAddress })
}

export const mixpanelSetUserProperties = (properties: Record<string, any>): void => {
  safeMixPanelPeopleSet(properties)

  if (!IS_PRODUCTION && isMixPanelInitialized) {
    console.info('[MixPanel] - User properties set:', properties)
  }
}

export const mixpanelSetEOAWalletLabel = (label: string): void => {
  safeMixPanelRegister({ [MixPanelEventParams.EOA_WALLET_LABEL]: label })
}

export const mixpanelSetEOAWalletAddress = (address: string): void => {
  safeMixPanelRegister({ [MixPanelEventParams.EOA_WALLET_ADDRESS]: address })
}

export const mixpanelSetEOAWalletNetwork = (network: string): void => {
  safeMixPanelRegister({ [MixPanelEventParams.EOA_WALLET_NETWORK]: network })
}

export const mixpanelTrack = (eventName: string, properties?: Record<string, any>): void => {
  safeMixPanelTrack(eventName, properties)

  if (!IS_PRODUCTION && isMixPanelInitialized) {
    console.info('[MixPanel] - Event tracked:', eventName, properties)
  }
}

export const mixpanelIdentify = (userId: string): void => {
  const lowercaseUserId = userId.toLowerCase()
  safeMixPanelIdentify(lowercaseUserId)

  if (!IS_PRODUCTION && isMixPanelInitialized) {
    console.info('[MixPanel] - User identified:', lowercaseUserId)
  }
}
