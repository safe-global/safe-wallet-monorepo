import mixpanel from 'mixpanel-browser'
import type { SafeAppData } from '@safe-global/safe-gateway-typescript-sdk'
import { IS_PRODUCTION, MIXPANEL_TOKEN } from '@/config/constants'
import { DeviceType } from './types'
import { MixPanelEventParams } from './mixpanel-events'
import packageJson from '../../../package.json'

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
  safeMixPanelTrack(eventName, properties)

  if (!IS_PRODUCTION && isMixPanelInitialized) {
    console.info('[MixPanel] - Event tracked:', eventName, properties)
  }
}

export const mixpanelIdentify = (userId: string): void => {
  safeMixPanelIdentify(userId)

  if (!IS_PRODUCTION && isMixPanelInitialized) {
    console.info('[MixPanel] - User identified:', userId)
  }
}
