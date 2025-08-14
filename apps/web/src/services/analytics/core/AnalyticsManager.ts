/**
 * Analytics Manager
 *
 * Central orchestrator for all analytics providers. This class:
 * - Manages multiple analytics providers (GA, Mixpanel, etc.)
 * - Routes events to appropriate providers based on configuration
 * - Handles provider-specific transformations and filtering
 * - Provides a unified API for components to use
 */

import type {
  AnalyticsProvider,
  AnalyticsEvent,
  EventConfiguration,
  TrackingResult,
  ProviderResult,
  AnalyticsConfig,
} from './types'
import { StandardEvents } from './types'

export class AnalyticsManager {
  private providers: Map<string, AnalyticsProvider> = new Map()
  private eventConfigurations: Map<string, EventConfiguration> = new Map()
  private config: AnalyticsConfig
  private isInitialized = false

  constructor(config: AnalyticsConfig) {
    this.config = config
  }

  /**
   * Initialize all providers and the manager
   */
  initialize(): void {
    if (this.isInitialized || !this.config.enabled) {
      return
    }

    // Initialize all registered providers
    this.providers.forEach((provider) => {
      try {
        provider.initialize()
        if (this.config.debug) {
          console.info(`[AnalyticsManager] Initialized provider: ${provider.name}`)
        }
      } catch (error) {
        console.error(`[AnalyticsManager] Failed to initialize provider ${provider.name}:`, error)
      }
    })

    // Load event configurations
    this.loadEventConfigurations()

    this.isInitialized = true

    if (this.config.debug) {
      console.info('[AnalyticsManager] Manager initialized with providers:', Array.from(this.providers.keys()))
    }
  }

  /**
   * Add an analytics provider
   */
  addProvider(provider: AnalyticsProvider): void {
    this.providers.set(provider.name, provider)

    if (this.config.debug) {
      console.info(`[AnalyticsManager] Provider added: ${provider.name}`)
    }
  }

  /**
   * Remove an analytics provider
   */
  removeProvider(providerName: string): void {
    this.providers.delete(providerName)

    if (this.config.debug) {
      console.info(`[AnalyticsManager] Provider removed: ${providerName}`)
    }
  }

  /**
   * Get a specific provider
   */
  getProvider(providerName: string): AnalyticsProvider | undefined {
    return this.providers.get(providerName)
  }

  /**
   * Track an event using the configured providers
   */
  track(eventKey: string, properties: Record<string, any> = {}): TrackingResult {
    if (!this.isInitialized || !this.config.enabled) {
      if (this.config.debug) {
        console.warn('[AnalyticsManager] Manager not initialized or disabled')
      }
      return { success: false, results: {} }
    }

    const eventConfig = this.eventConfigurations.get(eventKey)
    if (!eventConfig) {
      if (this.config.debug) {
        console.warn(`[AnalyticsManager] Unknown event: ${eventKey}`)
      }
      return { success: false, results: {} }
    }

    const results: Record<string, ProviderResult> = {}
    let overallSuccess = true

    // Enhanced properties with metadata
    const enhancedProperties = {
      ...properties,
      event_key: eventKey,
      timestamp: Date.now(),
    }

    // Send to GA if configured
    if (eventConfig.providers.ga?.enabled) {
      const gaProvider = this.providers.get('ga')
      if (gaProvider) {
        try {
          const result = this.sendToGA(gaProvider, eventConfig, enhancedProperties)
          results.ga = result
          if (!result.success) overallSuccess = false
        } catch (error) {
          results.ga = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
          overallSuccess = false
        }
      }
    }

    // Send to Mixpanel if configured
    if (eventConfig.providers.mixpanel?.enabled) {
      const mixpanelProvider = this.providers.get('mixpanel')
      if (mixpanelProvider) {
        try {
          const result = this.sendToMixpanel(mixpanelProvider, eventConfig, enhancedProperties)
          results.mixpanel = result
          if (!result.success) overallSuccess = false
        } catch (error) {
          results.mixpanel = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
          overallSuccess = false
        }
      }
    }

    if (this.config.debug) {
      console.group(`[AnalyticsManager] Event tracked: ${eventKey}`)
      console.log('Results:', results)
      console.log('Overall success:', overallSuccess)
      console.groupEnd()
    }

    return {
      success: overallSuccess,
      results,
    }
  }

  /**
   * Track multiple events in batch
   */
  trackBatch(events: Array<{ eventKey: string; properties?: Record<string, any> }>): TrackingResult[] {
    return events.map(({ eventKey, properties }) => this.track(eventKey, properties))
  }

  /**
   * Identify a user across all providers
   */
  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.isInitialized) {
      return
    }

    this.providers.forEach((provider, name) => {
      try {
        provider.identify(userId, traits)
      } catch (error) {
        console.error(`[AnalyticsManager] Failed to identify user in ${name}:`, error)
      }
    })

    if (this.config.debug) {
      console.info('[AnalyticsManager] User identified across all providers:', userId, traits)
    }
  }

  /**
   * Set a user property across all providers
   */
  setUserProperty(key: string, value: any): void {
    if (!this.isInitialized) {
      return
    }

    this.providers.forEach((provider, name) => {
      try {
        provider.setUserProperty(key, value)
      } catch (error) {
        console.error(`[AnalyticsManager] Failed to set user property in ${name}:`, error)
      }
    })
  }

  /**
   * Set a global property across all providers
   */
  setGlobalProperty(key: string, value: any): void {
    if (!this.isInitialized) {
      return
    }

    this.providers.forEach((provider, name) => {
      try {
        provider.setGlobalProperty(key, value)
      } catch (error) {
        console.error(`[AnalyticsManager] Failed to set global property in ${name}:`, error)
      }
    })
  }

  /**
   * Enable or disable tracking across all providers
   */
  setTrackingEnabled(enabled: boolean): void {
    this.providers.forEach((provider, name) => {
      try {
        provider.setTrackingEnabled(enabled)
      } catch (error) {
        console.error(`[AnalyticsManager] Failed to set tracking enabled in ${name}:`, error)
      }
    })

    if (this.config.debug) {
      console.info('[AnalyticsManager] Tracking enabled across all providers:', enabled)
    }
  }

  /**
   * Check if all providers are ready
   */
  areAllProvidersReady(): boolean {
    return Array.from(this.providers.values()).every((provider) => provider.isReady())
  }

  /**
   * Get status of all providers
   */
  getProviderStatuses(): Record<string, { ready: boolean; name: string }> {
    const statuses: Record<string, { ready: boolean; name: string }> = {}

    this.providers.forEach((provider, key) => {
      statuses[key] = {
        ready: provider.isReady(),
        name: provider.name,
      }
    })

    return statuses
  }

  /**
   * Get event configuration for debugging
   */
  getEventConfiguration(eventKey: string): EventConfiguration | undefined {
    return this.eventConfigurations.get(eventKey)
  }

  /**
   * Get all available event keys
   */
  getAvailableEvents(): string[] {
    return Array.from(this.eventConfigurations.keys())
  }

  private sendToGA(
    provider: AnalyticsProvider,
    eventConfig: EventConfiguration,
    properties: Record<string, any>,
  ): ProviderResult {
    const gaConfig = eventConfig.providers.ga!

    // Skip if no event name is configured (for disabled events)
    if (!gaConfig.eventName) {
      return {
        success: false,
        error: 'No GA event name configured',
      }
    }

    // Apply transformation if configured
    let transformedProperties = properties
    if (gaConfig.transform) {
      transformedProperties = gaConfig.transform(properties)
    }

    // For GA, we rely on the provider to filter parameters
    const event: AnalyticsEvent = {
      name: gaConfig.eventName,
      properties: transformedProperties,
    }

    try {
      provider.track(event)
      return {
        success: true,
        sentProperties: transformedProperties,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private sendToMixpanel(
    provider: AnalyticsProvider,
    eventConfig: EventConfiguration,
    properties: Record<string, any>,
  ): ProviderResult {
    const mixpanelConfig = eventConfig.providers.mixpanel!

    // Skip if no event name is configured (for disabled events)
    if (!mixpanelConfig.eventName) {
      return {
        success: false,
        error: 'No Mixpanel event name configured',
      }
    }

    let enrichedProperties = properties

    // Apply property enrichment if configured
    if (mixpanelConfig.enrichProperties) {
      enrichedProperties = mixpanelConfig.enrichProperties(properties)
    }

    // Apply transformation if configured
    if (mixpanelConfig.transform) {
      enrichedProperties = mixpanelConfig.transform(enrichedProperties)
    }

    const event: AnalyticsEvent = {
      name: mixpanelConfig.eventName,
      properties: enrichedProperties,
    }

    try {
      provider.track(event)
      return {
        success: true,
        sentProperties: enrichedProperties,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  private loadEventConfigurations(): void {
    // Load configurations from the config
    Object.entries(this.config.events).forEach(([eventKey, config]) => {
      this.eventConfigurations.set(eventKey, config)
    })

    if (this.config.debug) {
      console.info('[AnalyticsManager] Loaded event configurations:', this.eventConfigurations.size)
    }
  }

  /**
   * Convenience methods for common tracking patterns
   */

  /**
   * Track a page view
   */
  page(path: string, properties?: Record<string, any>): TrackingResult {
    return this.track(StandardEvents.PAGE_VIEW, {
      page_path: path,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      ...properties,
    })
  }

  /**
   * Track a button click
   */
  click(buttonName: string, properties?: Record<string, any>): TrackingResult {
    return this.track(StandardEvents.BUTTON_CLICK, {
      button_name: buttonName,
      ...properties,
    })
  }

  /**
   * Track an error
   */
  error(errorMessage: string, properties?: Record<string, any>): TrackingResult {
    return this.track(StandardEvents.ERROR_OCCURRED, {
      error_message: errorMessage,
      error_timestamp: new Date().toISOString(),
      ...properties,
    })
  }

  /**
   * Track feature usage
   */
  feature(featureName: string, properties?: Record<string, any>): TrackingResult {
    return this.track(StandardEvents.FEATURE_USED, {
      feature_name: featureName,
      ...properties,
    })
  }
}
