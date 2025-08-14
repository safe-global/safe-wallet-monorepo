/**
 * New Analytics Service - Unified API
 *
 * This is the new analytics implementation that provides:
 * - Clean abstraction over multiple analytics providers
 * - Proper parameter handling for GA vs Mixpanel
 * - Type-safe event tracking
 * - Development tools and debugging
 * - Backward compatibility with existing code
 */

import { GA_TRACKING_ID, MIXPANEL_TOKEN, IS_PRODUCTION } from '@/config/constants'
import { AnalyticsManager } from './core/AnalyticsManager'
import { GoogleAnalyticsProvider } from './providers/ga/GoogleAnalyticsProvider'
import { MixpanelProvider } from './providers/mixpanel/MixpanelProvider'
import { ANALYTICS_EVENTS } from './config/events.config'
import { analyticsDevTools } from './utils/DevTools'
import type { AnalyticsConfig, TrackingResult } from './core/types'

// Create the configuration
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

// Create the manager and providers
const manager = new AnalyticsManager(analyticsConfig)

// Add providers if tokens are available
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

// Initialize the manager
manager.initialize()

// Set up dev tools
if (analyticsDevTools) {
  analyticsDevTools.setManager(manager)
}

/**
 * Main Analytics API
 */
export const analytics = {
  /**
   * Track an event using the configured providers
   */
  track: (eventKey: string, properties?: Record<string, any>): TrackingResult => {
    return manager.track(eventKey, properties)
  },

  /**
   * Track multiple events in batch
   */
  trackBatch: (events: Array<{ eventKey: string; properties?: Record<string, any> }>): TrackingResult[] => {
    return manager.trackBatch(events)
  },

  /**
   * Track a page view
   */
  page: (path: string, properties?: Record<string, any>): TrackingResult => {
    return manager.page(path, properties)
  },

  /**
   * Track a button click
   */
  click: (buttonName: string, properties?: Record<string, any>): TrackingResult => {
    return manager.click(buttonName, properties)
  },

  /**
   * Track an error
   */
  error: (errorMessage: string, properties?: Record<string, any>): TrackingResult => {
    return manager.error(errorMessage, properties)
  },

  /**
   * Track feature usage
   */
  feature: (featureName: string, properties?: Record<string, any>): TrackingResult => {
    return manager.feature(featureName, properties)
  },

  /**
   * Identify a user across all providers
   */
  identify: (userId: string, traits?: Record<string, any>): void => {
    manager.identify(userId, traits)
  },

  /**
   * Set a user property across all providers
   */
  setUserProperty: (key: string, value: any): void => {
    manager.setUserProperty(key, value)
  },

  /**
   * Set a global property across all providers
   */
  setGlobalProperty: (key: string, value: any): void => {
    manager.setGlobalProperty(key, value)
  },

  /**
   * Enable or disable tracking
   */
  setTrackingEnabled: (enabled: boolean): void => {
    manager.setTrackingEnabled(enabled)
  },

  /**
   * Check if analytics is ready
   */
  isReady: (): boolean => {
    return manager.areAllProvidersReady()
  },

  /**
   * Get the status of all providers
   */
  getStatus: () => {
    return manager.getProviderStatuses()
  },

  /**
   * Advanced: Get the manager instance
   */
  getManager: () => manager,

  /**
   * Advanced: Track to specific provider only
   */
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

/**
 * Convenience methods for common Safe Wallet events
 */
export const safeAnalytics = {
  /**
   * Track Safe creation
   */
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

  /**
   * Track Safe activation
   */
  safeActivated: (properties: {
    chain_id: string
    safe_address: string
    safe_version?: string
    deployment_type?: string
    [key: string]: any
  }) => {
    return analytics.track('SAFE_ACTIVATED', properties)
  },

  /**
   * Track wallet connection
   */
  walletConnected: (properties: { wallet_type: string; chain_id: string; [key: string]: any }) => {
    return analytics.track('WALLET_CONNECTED', properties)
  },

  /**
   * Track Safe App launch
   */
  safeAppLaunched: (properties: {
    safe_app_name: string
    launch_location: string
    chain_id: string
    safe_app_url?: string
    [key: string]: any
  }) => {
    return analytics.track('SAFE_APP_LAUNCHED', properties)
  },

  /**
   * Set Safe context (call when Safe is loaded/changed)
   */
  setSafeContext: (safeAddress: string, chainId: string, safeVersion?: string) => {
    analytics.setGlobalProperty('safe_address', safeAddress)
    analytics.setGlobalProperty('chain_id', chainId)
    if (safeVersion) {
      analytics.setGlobalProperty('safe_version', safeVersion)
    }

    // Set context on individual providers for provider-specific handling
    const gaProvider = manager.getProvider('ga') as GoogleAnalyticsProvider
    if (gaProvider && typeof gaProvider.setSafeContext === 'function') {
      gaProvider.setSafeContext(safeAddress, chainId, safeVersion)
    }
  },

  /**
   * Set wallet context (call when wallet is connected/changed)
   */
  setWalletContext: (walletType: string, walletAddress?: string) => {
    analytics.setGlobalProperty('wallet_type', walletType)
    if (walletAddress) {
      analytics.setGlobalProperty('wallet_address', walletAddress)
    }

    // Set context on individual providers
    const gaProvider = manager.getProvider('ga') as GoogleAnalyticsProvider
    if (gaProvider && typeof gaProvider.setWalletContext === 'function') {
      gaProvider.setWalletContext(walletType, walletAddress)
    }
  },
}

// Export types for external use
export type { TrackingResult, AnalyticsConfig } from './core/types'
export { StandardEvents, PropertyKeys } from './core/types'

// Export dev tools for debugging
export { analyticsDevTools }

// Export provider classes for advanced usage
export { GoogleAnalyticsProvider, MixpanelProvider, AnalyticsManager }

/**
 * Hook to initialize analytics system in the app
 * Replaces the old useMixpanel hook with new analytics initialization
 */
export const useAnalytics = () => {
  // Analytics system is already initialized when this module is imported
  // This hook is mainly for compatibility with the old useMixpanel pattern
  // The new system auto-initializes and handles consent/context via the manager

  // In the future, we can add specific initialization logic here if needed
  return null
}

// Export event configurations for reference
export { ANALYTICS_EVENTS } from './config/events.config'

/**
 * Legacy compatibility layer - deprecated, use analytics.track() instead
 */
export const trackEvent = (eventData: any, additionalParameters?: Record<string, any>): TrackingResult => {
  if (!IS_PRODUCTION) {
    console.warn(
      '[Analytics] trackEvent is deprecated. Use analytics.track() with StandardEvents instead.',
      '\nSee migration guide for details.',
    )
  }

  // Try to map old event structure to new system
  if (eventData?.action) {
    return analytics.track('BUTTON_CLICK', {
      button_name: eventData.action,
      category: eventData.category,
      label: eventData.label,
      chain_id: eventData.chainId,
      ...additionalParameters,
    })
  }

  // Fallback for unmapped events
  return { success: false, results: {} }
}

export const trackSafeAppEvent = (
  eventData: any,
  safeApp?: any,
  options?: { launchLocation?: string; sdkEventData?: any },
): TrackingResult => {
  if (!IS_PRODUCTION) {
    console.warn('[Analytics] trackSafeAppEvent is deprecated. Use safeAnalytics.safeAppLaunched() instead.')
  }

  if (safeApp && eventData?.action === 'Open Safe App') {
    return safeAnalytics.safeAppLaunched({
      safe_app_name: safeApp.name,
      launch_location: options?.launchLocation || 'unknown',
      chain_id: eventData.chainId || '',
      safe_app_url: safeApp.url,
      safe_app_tags: safeApp.tags,
    })
  }

  return { success: false, results: {} }
}

export const trackMixPanelEvent = (eventName: string, properties?: Record<string, any>): void => {
  if (!IS_PRODUCTION) {
    console.warn('[Analytics] trackMixPanelEvent is deprecated. Use analytics.track() instead.')
  }

  // Try to find matching event configuration
  const matchingEvent = Object.entries(ANALYTICS_EVENTS).find(
    ([, config]) => config.providers.mixpanel?.eventName === eventName,
  )

  if (matchingEvent) {
    analytics.track(matchingEvent[0], properties)
  } else {
    // Fallback: send directly to Mixpanel provider
    const mixpanelProvider = manager.getProvider('mixpanel')
    if (mixpanelProvider) {
      mixpanelProvider.track({
        name: eventName,
        properties,
      })
    }
  }
}

// Re-export existing types for compatibility
export * from './types'
export * from './events'
export * from './mixpanel-events'

if (!IS_PRODUCTION) {
  console.info(
    '🔄 [Analytics] New analytics system loaded.\n' +
      'Migration guide: https://github.com/safe-global/safe-wallet-web/docs/analytics-migration.md',
  )
}
