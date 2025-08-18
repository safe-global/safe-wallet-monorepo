import { useEffect } from 'react'
import { useAppSelector } from '@/store'
import { hasConsentFor, CookieAndTermType } from '@/store/cookiesAndTermsSlice'
import { GA_TRACKING_ID, MIXPANEL_TOKEN, IS_PRODUCTION } from '@/config/constants'
import { AnalyticsManager } from './core/AnalyticsManager'
import { GoogleAnalyticsProvider } from './providers/ga/GoogleAnalyticsProvider'
import { MixpanelProvider } from './providers/mixpanel/MixpanelProvider'
import { ANALYTICS_EVENTS } from './config/events.config'
import { analyticsDevTools } from './utils/DevTools'
import type { AnalyticsConfig, TrackingResult, GAProviderConfig, MixpanelProviderConfig } from './core/types'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { useSafeIdentification } from '@/hooks/useSafeIdentification'
import { useSafeUserProperties } from '@/hooks/useSafeUserProperties'

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
}

// Extract provider-specific configurations from centralized config
function extractGAConfigurations() {
  const gaConfigs: Record<string, GAProviderConfig> = {}
  Object.entries(ANALYTICS_EVENTS).forEach(([eventKey, config]) => {
    if (config.providers.ga) {
      gaConfigs[eventKey] = config.providers.ga
    }
  })
  return gaConfigs
}

function extractMixpanelConfigurations() {
  const mixpanelConfigs: Record<string, MixpanelProviderConfig> = {}
  Object.entries(ANALYTICS_EVENTS).forEach(([eventKey, config]) => {
    if (config.providers.mixpanel) {
      mixpanelConfigs[eventKey] = config.providers.mixpanel
    }
  })
  return mixpanelConfigs
}

const manager = new AnalyticsManager(analyticsConfig)

if (GA_TRACKING_ID) {
  const gaProvider = new GoogleAnalyticsProvider({
    trackingId: GA_TRACKING_ID,
    debug: !IS_PRODUCTION,
    enabled: true,
    eventConfigurations: extractGAConfigurations(),
  })
  manager.addProvider(gaProvider)
}

if (MIXPANEL_TOKEN) {
  const mixpanelProvider = new MixpanelProvider({
    token: MIXPANEL_TOKEN,
    debug: !IS_PRODUCTION,
    enabled: true,
    eventConfigurations: extractMixpanelConfigurations(),
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

  identify: (userId: string, traits?: Record<string, any>): void => {
    manager.identify(userId, traits)
  },

  reset: (): void => {
    manager.reset()
  },

  getManager: () => manager,
}

const setSafeContext = (safeAddress: string, chainId: string, safeVersion?: string) => {
  analytics.setGlobalProperty('safe_address', safeAddress)
  analytics.setGlobalProperty('chain_id', chainId)
  if (safeVersion) {
    analytics.setGlobalProperty('safe_version', safeVersion)
  }
  const gaProvider = manager.getProvider('ga') as GoogleAnalyticsProvider
  if (gaProvider && typeof gaProvider.setSafeContext === 'function') {
    gaProvider.setSafeContext(safeAddress, chainId, safeVersion)
  }
}

const setWalletContext = (walletType: string, walletAddress?: string) => {
  analytics.setGlobalProperty('wallet_type', walletType)
  if (walletAddress) {
    analytics.setGlobalProperty('wallet_address', walletAddress)
  }
  const gaProvider = manager.getProvider('ga') as GoogleAnalyticsProvider
  if (gaProvider && typeof gaProvider.setWalletContext === 'function') {
    gaProvider.setWalletContext(walletType, walletAddress)
  }
}

export const safeAnalytics = {
  safeCreated: (properties: {
    chain_id: string
    deployment_type: 'standard' | 'counterfactual'
    payment_method: string
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
    safe_app_category: string
    launch_location: string
    network_name: string
    chain_id: string
    safe_app_url?: string
    [key: string]: any
  }) => {
    return analytics.track('SAFE_APP_LAUNCHED', properties)
  },

  setSafeContext,
  setWalletContext,

  // User Properties for Mixpanel cohort analysis
  setSafeUserProperties: (safeAddress: string, safeInfo: ExtendedSafeInfo, chainName: string, networks: string[]) => {
    // Global properties (no chain prefix)
    analytics.setUserProperty('Safe Address', safeAddress)
    if (safeInfo.version) {
      analytics.setUserProperty('Safe Version', safeInfo.version)
    }
    analytics.setUserProperty('Blockchain Networks', networks)

    // Chain-specific properties
    analytics.setUserProperty(`Number of Signers on ${chainName}`, safeInfo.owners?.length || 0)
    analytics.setUserProperty(`Threshold on ${chainName}`, safeInfo.threshold || 0)
    analytics.setUserProperty(`Total Transaction Count on ${chainName}`, safeInfo.nonce || 0)
  },

  updateSafeTransactionCount: (nonce: number, chainName: string) => {
    analytics.setUserProperty(`Total Transaction Count on ${chainName}`, nonce)
  },

  updateSafeThreshold: (threshold: number, chainName: string) => {
    analytics.setUserProperty(`Threshold on ${chainName}`, threshold)
  },

  updateSafeSigners: (signerCount: number, chainName: string) => {
    analytics.setUserProperty(`Number of Signers on ${chainName}`, signerCount)
  },

  setSafeCreationDate: (creationDate: Date, chainName: string) => {
    analytics.setUserProperty(`Created at on ${chainName}`, creationDate.toISOString())
  },

  addSafeNetwork: (networks: string[]) => {
    analytics.setUserProperty('Blockchain Networks', networks)
  },
}

export type { TrackingResult, AnalyticsConfig } from './core/types'
export { StandardEvents, PropertyKeys } from './core/types'

export { analyticsDevTools }

export { GoogleAnalyticsProvider, MixpanelProvider, AnalyticsManager }

const useAnalyticsConsent = () => {
  const isAnalyticsEnabled = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.ANALYTICS))

  useEffect(() => {
    // Set tracking enabled/disabled based on current consent state
    analytics.setTrackingEnabled(isAnalyticsEnabled)

    if (!IS_PRODUCTION) {
      console.info('[Analytics] Tracking consent updated:', isAnalyticsEnabled)
    }
  }, [isAnalyticsEnabled])
}

export const useAnalytics = () => {
  useAnalyticsConsent()
  useSafeIdentification()
  useSafeUserProperties()

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
