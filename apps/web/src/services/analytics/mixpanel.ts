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
  [MixPanelEventParams.EOA_WALLET_LABEL]: '',
  [MixPanelEventParams.EOA_WALLET_ADDRESS]: '',
  [MixPanelEventParams.EOA_WALLET_NETWORK]: '',
}

let isMixPanelInitialized = false

const safeMixPanelRegister = (properties: Record<string, any>): void => {
  if (isMixPanelInitialized) {
    mixpanel.register(properties)
  }
}

const safeMixPanelPeopleSet = (properties: Record<string, any>): void => {
  if (isMixPanelInitialized) {
    mixpanel.people.set(properties)
  }
}

const safeMixPanelTrack = (eventName: string, properties?: Record<string, any>): void => {
  if (isMixPanelInitialized) {
    mixpanel.track(eventName, properties)
  }
}

const safeMixPanelIdentify = (userId: string): void => {
  if (isMixPanelInitialized) {
    mixpanel.identify(userId)
  }
}

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
      ip: false,
    })

    isMixPanelInitialized = true

    if (!IS_PRODUCTION) {
      console.info('[MixPanel] - Initialized')
    }
  } catch (error) {
    console.error('[MixPanel] - Initialization failed:', error)
  }
}

export const mixpanelSetBlockchainNetwork = (networkName: string): void => {
  commonEventParams[MixPanelEventParams.BLOCKCHAIN_NETWORK] = networkName
  safeMixPanelRegister({ [MixPanelEventParams.BLOCKCHAIN_NETWORK]: networkName })
}

export const mixpanelSetDeviceType = (type: DeviceType): void => {
  commonEventParams[MixPanelEventParams.DEVICE_TYPE] = type
  safeMixPanelRegister({ [MixPanelEventParams.DEVICE_TYPE]: type })
}

export const mixpanelSetSafeAddress = (safeAddress: string): void => {
  commonEventParams[MixPanelEventParams.SAFE_ADDRESS] = safeAddress
  safeMixPanelRegister({ [MixPanelEventParams.SAFE_ADDRESS]: safeAddress })
}

export const mixpanelSetUserProperties = (properties: Record<string, any>): void => {
  safeMixPanelPeopleSet(properties)

  if (!IS_PRODUCTION && isMixPanelInitialized) {
    console.info('[MixPanel] - User properties set:', properties)
  }
}

export const mixpanelSetEOAWalletLabel = (label: string): void => {
  commonEventParams[MixPanelEventParams.EOA_WALLET_LABEL] = label
  safeMixPanelRegister({ [MixPanelEventParams.EOA_WALLET_LABEL]: label })
}

export const mixpanelSetEOAWalletAddress = (address: string): void => {
  commonEventParams[MixPanelEventParams.EOA_WALLET_ADDRESS] = address
  safeMixPanelRegister({ [MixPanelEventParams.EOA_WALLET_ADDRESS]: address })
}

export const mixpanelSetEOAWalletNetwork = (network: string): void => {
  commonEventParams[MixPanelEventParams.EOA_WALLET_NETWORK] = network
  safeMixPanelRegister({ [MixPanelEventParams.EOA_WALLET_NETWORK]: network })
}

/**
 * Convert SafeApp object to MixPanel event properties
 */
export const safeAppToMixPanelEventProperties = (
  safeApp: SafeAppData,
  options?: {
    launchLocation?: string
  },
): Record<string, any> => {
  const properties: Record<string, any> = {
    'Safe App Name': safeApp.name,
    'Safe App Tags': safeApp.tags,
  }

  if (options?.launchLocation) {
    properties['Launch Location'] = options.launchLocation
  }

  return properties
}

export const mixpanelTrack = (eventName: string, properties?: Record<string, any>): void => {
  const eventProperties: Record<string, any> = {
    ...commonEventParams,
    ...properties,
  }

  safeMixPanelTrack(eventName, eventProperties)

  if (!IS_PRODUCTION && isMixPanelInitialized) {
    console.info('[MixPanel] - Event tracked:', eventName, eventProperties)
  }
}

export const mixpanelIdentify = (userId: string): void => {
  safeMixPanelIdentify(userId)

  if (!IS_PRODUCTION && isMixPanelInitialized) {
    console.info('[MixPanel] - User identified:', userId)
  }
}
