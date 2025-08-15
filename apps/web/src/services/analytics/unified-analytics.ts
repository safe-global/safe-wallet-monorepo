import { GA_TRACKING_ID, MIXPANEL_TOKEN, IS_PRODUCTION } from '@/config/constants'
import { AnalyticsManager } from './core/AnalyticsManager'
import { GoogleAnalyticsProvider } from './providers/ga/GoogleAnalyticsProvider'
import { MixpanelProvider } from './providers/mixpanel/MixpanelProvider'
import { ANALYTICS_EVENTS } from './config/events.config'
import { analyticsDevTools } from './utils/DevTools'
import type { AnalyticsConfig, TrackingResult } from './core/types'

const analyticsConfig: AnalyticsConfig = {
  enabled: true,
  debug: !IS_PRODUCTION,
  providers: {
    ga: {
      enabled: !!GA_TRACKING_ID,
      trackingId: GA_TRACKING_ID || '',
    },
    mixpanel: {
      enabled: !!MIXPANEL_TOKEN,
      token: MIXPANEL_TOKEN || '',
    },
  },
  events: ANALYTICS_EVENTS,
}

const manager = new AnalyticsManager(analyticsConfig)

if (GA_TRACKING_ID) {
  const gaProvider = new GoogleAnalyticsProvider({
    trackingId: GA_TRACKING_ID,
    debug: !IS_PRODUCTION,
    enabled: true,
  })
  manager.addProvider(gaProvider)
}

if (MIXPANEL_TOKEN) {
  const mixpanelProvider = new MixpanelProvider({
    token: MIXPANEL_TOKEN,
    debug: !IS_PRODUCTION,
    enabled: true,
  })
  manager.addProvider(mixpanelProvider)
}

manager.initialize()

if (analyticsDevTools) {
  analyticsDevTools.setManager(manager)
}

export const analytics = {
  track: (eventKey: string, properties?: Record<string, any>): TrackingResult => {
    return manager.track(eventKey, properties)
  },

  page: (path: string, properties?: Record<string, any>): TrackingResult => {
    return manager.page(path, properties)
  },

  click: (buttonName: string, properties?: Record<string, any>): TrackingResult => {
    return manager.click(buttonName, properties)
  },

  error: (errorMessage: string, properties?: Record<string, any>): TrackingResult => {
    return manager.error(errorMessage, properties)
  },

  feature: (featureName: string, properties?: Record<string, any>): TrackingResult => {
    return manager.feature(featureName, properties)
  },

  identify: (userId: string, traits?: Record<string, any>): void => {
    manager.identify(userId, traits)
  },

  setUserProperty: (key: string, value: any): void => {
    manager.setUserProperty(key, value)
  },

  setGlobalProperty: (key: string, value: any): void => {
    manager.setGlobalProperty(key, value)
  },

  setTrackingEnabled: (enabled: boolean): void => {
    manager.setTrackingEnabled(enabled)
  },

  isReady: (): boolean => {
    return manager.areAllProvidersReady()
  },

  getStatus: () => {
    return manager.getProviderStatuses()
  },

  getManager: () => manager,

  trackToProvider: (providerName: string, eventKey: string, properties?: Record<string, any>) => {
    const provider = manager.getProvider(providerName)
    if (provider) {
      provider.track({
        name: eventKey,
        properties,
      })
    }
  },
}

export const safeAnalytics = {
  safeCreated: (properties: {
    chain_id: string
    deployment_type: 'standard' | 'counterfactual'
    payment_method: 'wallet' | 'relay'
    threshold: number
    num_owners: number
    safe_version?: string
    [key: string]: any
  }) => {
    return analytics.track('SAFE_CREATED', properties)
  },

  safeActivated: (properties: {
    chain_id: string
    safe_address: string
    safe_version?: string
    deployment_type?: string
    [key: string]: any
  }) => {
    return analytics.track('SAFE_ACTIVATED', properties)
  },

  walletConnected: (properties: { wallet_type: string; chain_id: string; [key: string]: any }) => {
    return analytics.track('WALLET_CONNECTED', properties)
  },

  safeAppLaunched: (properties: {
    safe_app_name: string
    launch_location: string
    chain_id: string
    safe_app_url?: string
    [key: string]: any
  }) => {
    return analytics.track('SAFE_APP_LAUNCHED', properties)
  },

  setSafeContext: (safeAddress: string, chainId: string, safeVersion?: string) => {
    analytics.setGlobalProperty('safe_address', safeAddress)
    analytics.setGlobalProperty('chain_id', chainId)
    if (safeVersion) {
      analytics.setGlobalProperty('safe_version', safeVersion)
    }

    const gaProvider = manager.getProvider('ga') as GoogleAnalyticsProvider
    if (gaProvider && typeof gaProvider.setSafeContext === 'function') {
      gaProvider.setSafeContext(safeAddress, chainId, safeVersion)
    }
  },

  setWalletContext: (walletType: string, walletAddress?: string) => {
    analytics.setGlobalProperty('wallet_type', walletType)
    if (walletAddress) {
      analytics.setGlobalProperty('wallet_address', walletAddress)
    }

    const gaProvider = manager.getProvider('ga') as GoogleAnalyticsProvider
    if (gaProvider && typeof gaProvider.setWalletContext === 'function') {
      gaProvider.setWalletContext(walletType, walletAddress)
    }
  },
}

export type { TrackingResult, AnalyticsConfig } from './core/types'
export { StandardEvents, PropertyKeys } from './core/types'

export { analyticsDevTools }

export { GoogleAnalyticsProvider, MixpanelProvider, AnalyticsManager }

export const useAnalytics = () => {
  return null
}

export { ANALYTICS_EVENTS } from './config/events.config'

export * from './types'
export * from './events'
export * from './mixpanel-events'

if (!IS_PRODUCTION) {
  console.info(
    '🔄 [Analytics] New analytics system loaded.\n' +
      'Migration guide: https://github.com/safe-global/safe-wallet-web/docs/analytics-migration.md',
  )
}
