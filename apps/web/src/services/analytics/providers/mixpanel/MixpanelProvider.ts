/**
 * Mixpanel Analytics Provider
 *
 * Implements the AnalyticsProvider interface for Mixpanel.
 * Unlike GA4, Mixpanel accepts any properties without pre-registration,
 * making it ideal for detailed event tracking with rich context.
 */

import mixpanel from 'mixpanel-browser'
import { IS_PRODUCTION } from '@/config/constants'
import type { AnalyticsProvider, AnalyticsEvent } from '../../core/types'
import packageJson from '../../../../../package.json'

export interface MixpanelConfig {
  token: string
  debug?: boolean
  enabled?: boolean
  persistence?: 'localStorage' | 'cookie'
  optOutByDefault?: boolean
}

export class MixpanelProvider implements AnalyticsProvider {
  public readonly name = 'mixpanel'

  private config: MixpanelConfig
  private isInitialized = false
  private globalProperties: Record<string, any> = {}
  private userProperties: Record<string, any> = {}

  constructor(config: MixpanelConfig) {
    this.config = {
      debug: !IS_PRODUCTION,
      enabled: true,
      persistence: 'localStorage',
      optOutByDefault: true,
      ...config,
    }

    // Set default global properties
    this.setDefaultGlobalProperties()
  }

  initialize(): void {
    if (this.isInitialized || !this.config.enabled) {
      return
    }

    if (!this.config.token) {
      if (this.config.debug) {
        console.warn('[MixpanelProvider] No token provided, skipping initialization')
      }
      return
    }

    try {
      mixpanel.init(this.config.token, {
        debug: this.config.debug,
        persistence: this.config.persistence,
        autocapture: false, // We handle events manually
        batch_requests: true,
        ip: false, // Don't collect IP for privacy
        opt_out_tracking_by_default: this.config.optOutByDefault,
      })

      // Register global properties
      mixpanel.register(this.globalProperties)

      this.isInitialized = true

      if (this.config.debug) {
        console.info('[MixpanelProvider] Initialized with token:', this.config.token.substring(0, 8) + '...')
      }
    } catch (error) {
      console.error('[MixpanelProvider] Failed to initialize:', error)
    }
  }

  track(event: AnalyticsEvent): void {
    if (!this.isInitialized || !this.config.enabled || !this.isTrackingEnabled()) {
      if (this.config.debug && !this.isTrackingEnabled()) {
        console.info('[MixpanelProvider] Tracking disabled, skipping event:', event.name)
      }
      return
    }

    try {
      // Combine all properties - Mixpanel accepts everything
      const allProperties = {
        ...this.globalProperties,
        ...event.properties,
        // Add event metadata
        event_timestamp: event.metadata?.timestamp || Date.now(),
        event_source: event.metadata?.source || 'unknown',
      }

      // Clean up properties for Mixpanel
      const cleanedProperties = this.cleanProperties(allProperties)

      mixpanel.track(event.name, cleanedProperties)

      if (this.config.debug) {
        console.group(`[MixpanelProvider] Event: ${event.name}`)
        console.log('Properties sent:', cleanedProperties)
        console.log('Total properties:', Object.keys(cleanedProperties).length)
        console.groupEnd()
      }
    } catch (error) {
      console.error('[MixpanelProvider] Failed to track event:', error)
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.isInitialized || !this.config.enabled) {
      return
    }

    try {
      mixpanel.identify(userId)

      // Set user properties if provided
      if (traits) {
        const cleanedTraits = this.cleanProperties(traits)
        mixpanel.people.set(cleanedTraits)

        // Store locally
        Object.assign(this.userProperties, cleanedTraits)
      }

      if (this.config.debug) {
        console.info('[MixpanelProvider] User identified:', userId, traits)
      }
    } catch (error) {
      console.error('[MixpanelProvider] Failed to identify user:', error)
    }
  }

  setUserProperty(key: string, value: any): void {
    if (!this.isInitialized || !this.config.enabled) {
      return
    }

    try {
      const cleanedValue = this.cleanValue(value)

      // Store locally
      this.userProperties[key] = cleanedValue

      // Set in Mixpanel
      mixpanel.people.set({ [key]: cleanedValue })

      if (this.config.debug) {
        console.info('[MixpanelProvider] User property set:', key, '=', cleanedValue)
      }
    } catch (error) {
      console.error('[MixpanelProvider] Failed to set user property:', error)
    }
  }

  setGlobalProperty(key: string, value: any): void {
    const cleanedValue = this.cleanValue(value)

    // Store locally
    this.globalProperties[key] = cleanedValue

    // Register in Mixpanel (applies to all future events)
    if (this.isInitialized) {
      try {
        mixpanel.register({ [key]: cleanedValue })
      } catch (error) {
        console.error('[MixpanelProvider] Failed to register global property:', error)
      }
    }

    if (this.config.debug) {
      console.info('[MixpanelProvider] Global property set:', key, '=', cleanedValue)
    }
  }

  setTrackingEnabled(enabled: boolean): void {
    this.config.enabled = enabled

    if (!this.isInitialized) {
      return
    }

    try {
      if (enabled) {
        mixpanel.opt_in_tracking()
      } else {
        mixpanel.opt_out_tracking()
      }

      if (this.config.debug) {
        console.info('[MixpanelProvider] Tracking enabled:', enabled)
      }
    } catch (error) {
      console.error('[MixpanelProvider] Failed to set tracking enabled:', error)
    }
  }

  isReady(): boolean {
    return this.isInitialized && !!mixpanel
  }

  /**
   * Check if tracking is currently enabled
   */
  isTrackingEnabled(): boolean {
    if (!this.isInitialized) {
      return false
    }

    try {
      // Mixpanel's has_opted_in_tracking returns true if user has opted in
      return mixpanel.has_opted_in_tracking()
    } catch {
      // If there's an error, assume tracking is disabled
      return false
    }
  }

  /**
   * Get current user properties
   */
  getUserProperties(): Record<string, any> {
    return { ...this.userProperties }
  }

  /**
   * Get current global properties
   */
  getGlobalProperties(): Record<string, any> {
    return { ...this.globalProperties }
  }

  /**
   * Track user registration/signup
   */
  trackSignup(userId: string, properties?: Record<string, any>): void {
    if (!this.isInitialized || !this.config.enabled) {
      return
    }

    try {
      mixpanel.alias(userId)
      this.track({
        name: 'Sign Up',
        properties: {
          distinct_id: userId,
          ...properties,
        },
      })
    } catch (error) {
      console.error('[MixpanelProvider] Failed to track signup:', error)
    }
  }

  /**
   * Increment a numeric user property
   */
  incrementUserProperty(property: string, value: number = 1): void {
    if (!this.isInitialized || !this.config.enabled) {
      return
    }

    try {
      mixpanel.people.increment({ [property]: value })

      // Update local copy
      if (typeof this.userProperties[property] === 'number') {
        this.userProperties[property] += value
      } else {
        this.userProperties[property] = value
      }
    } catch (error) {
      console.error('[MixpanelProvider] Failed to increment user property:', error)
    }
  }

  /**
   * Set user property only if it doesn't exist
   */
  setUserPropertyOnce(key: string, value: any): void {
    if (!this.isInitialized || !this.config.enabled) {
      return
    }

    try {
      const cleanedValue = this.cleanValue(value)
      mixpanel.people.set_once({ [key]: cleanedValue })
    } catch (error) {
      console.error('[MixpanelProvider] Failed to set user property once:', error)
    }
  }

  /**
   * Reset Mixpanel data (useful for logout)
   */
  reset(): void {
    if (!this.isInitialized) {
      return
    }

    try {
      mixpanel.reset()
      this.userProperties = {}

      // Re-register global properties
      mixpanel.register(this.globalProperties)

      if (this.config.debug) {
        console.info('[MixpanelProvider] Reset completed')
      }
    } catch (error) {
      console.error('[MixpanelProvider] Failed to reset:', error)
    }
  }

  private setDefaultGlobalProperties(): void {
    this.globalProperties = {
      'App Version': packageJson.version,
      'Device Type': this.getDeviceType(),
      // Mixpanel allows spaces and special characters in property names
      $browser: this.getBrowser(),
      $os: this.getOS(),
    }
  }

  private getDeviceType(): string {
    if (typeof window === 'undefined') {
      return 'Desktop'
    }

    const userAgent = navigator.userAgent
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? 'Tablet' : 'Mobile'
    }
    return 'Desktop'
  }

  private getBrowser(): string {
    if (typeof window === 'undefined') {
      return 'Unknown'
    }

    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private getOS(): string {
    if (typeof window === 'undefined') {
      return 'Unknown'
    }

    const userAgent = navigator.userAgent
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Win')) return 'Windows'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }

  /**
   * Clean properties for Mixpanel
   */
  private cleanProperties(properties: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {}

    Object.entries(properties).forEach(([key, value]) => {
      cleaned[key] = this.cleanValue(value)
    })

    return cleaned
  }

  /**
   * Clean individual values for Mixpanel compatibility
   */
  private cleanValue(value: any): any {
    // Null/undefined handling
    if (value === null || value === undefined) {
      return null
    }

    // Mixpanel supports most data types natively
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value
    }

    // Handle dates
    if (value instanceof Date) {
      return value.toISOString()
    }

    // Handle arrays - Mixpanel supports arrays
    if (Array.isArray(value)) {
      return value.map((item) => this.cleanValue(item))
    }

    // Handle objects - Mixpanel supports nested objects to some extent
    if (typeof value === 'object') {
      const cleaned: Record<string, any> = {}
      Object.entries(value).forEach(([key, val]) => {
        cleaned[key] = this.cleanValue(val)
      })
      return cleaned
    }

    return value
  }
}
