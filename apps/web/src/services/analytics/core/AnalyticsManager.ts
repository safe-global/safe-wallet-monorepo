import type { AnalyticsProvider, AnalyticsEvent, TrackingResult, ProviderResult, AnalyticsConfig } from './types'

export class AnalyticsManager {
  private providers: Map<string, AnalyticsProvider> = new Map()
  private config: AnalyticsConfig
  private isInitialized = false

  constructor(config: AnalyticsConfig) {
    this.config = config
  }

  initialize(): void {
    if (this.isInitialized || !this.config.enabled) {
      return
    }

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

    this.isInitialized = true

    if (this.config.debug) {
      console.info('[AnalyticsManager] Manager initialized with providers:', Array.from(this.providers.keys()))
    }
  }

  addProvider(provider: AnalyticsProvider): void {
    this.providers.set(provider.name, provider)

    if (this.config.debug) {
      console.info(`[AnalyticsManager] Provider added: ${provider.name}`)
    }
  }

  removeProvider(providerName: string): void {
    this.providers.delete(providerName)

    if (this.config.debug) {
      console.info(`[AnalyticsManager] Provider removed: ${providerName}`)
    }
  }

  getProvider(providerName: string): AnalyticsProvider | undefined {
    return this.providers.get(providerName)
  }

  track(eventKey: string, properties: Record<string, any> = {}): TrackingResult {
    if (!this.isInitialized || !this.config.enabled) {
      if (this.config.debug) {
        console.warn('[AnalyticsManager] Manager not initialized or disabled')
      }
      return { success: false, results: {} }
    }

    const enhancedProperties = {
      ...properties,
      event_key: eventKey,
      timestamp: Date.now(),
    }

    const event: AnalyticsEvent = {
      name: eventKey,
      properties: enhancedProperties,
    }

    const results: Record<string, ProviderResult> = {}
    let overallSuccess = true

    // Simple event broadcasting to all providers
    this.providers.forEach((provider, providerName) => {
      try {
        provider.track(event)
        results[providerName] = { success: true }
      } catch (error) {
        results[providerName] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
        overallSuccess = false
      }
    })

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

  areAllProvidersReady(): boolean {
    return Array.from(this.providers.values()).every((provider) => provider.isReady())
  }

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
}
