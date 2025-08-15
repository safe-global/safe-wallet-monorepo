import mixpanel from 'mixpanel-browser'
import { IS_PRODUCTION } from '@/config/constants'
import type { AnalyticsProvider, AnalyticsEvent, MixpanelProviderConfig } from '../../core/types'
import packageJson from '../../../../../package.json'

export interface MixpanelConfig {
  token: string
  debug?: boolean
  enabled?: boolean
  persistence?: 'localStorage' | 'cookie'
  optOutByDefault?: boolean
  eventConfigurations?: Record<string, MixpanelProviderConfig>
}

export class MixpanelProvider implements AnalyticsProvider {
  public readonly name = 'mixpanel'

  private config: MixpanelConfig
  private eventConfigurations: Record<string, MixpanelProviderConfig>
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
    this.eventConfigurations = config.eventConfigurations || {}

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
        autocapture: false,
        batch_requests: true,
        ip: false,
        opt_out_tracking_by_default: this.config.optOutByDefault,
      })

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

    // Check if this provider should handle this event
    const eventConfig = this.eventConfigurations[event.name]
    if (!eventConfig?.enabled) {
      // Silently ignore events this provider doesn't handle
      return
    }

    try {
      let properties = {
        ...this.globalProperties,
        ...event.properties,
        event_timestamp: event.metadata?.timestamp || Date.now(),
        event_source: event.metadata?.source || 'unknown',
      }

      // Apply Mixpanel-specific enrichProperties if provided
      if (eventConfig.enrichProperties) {
        const enrichedProps = eventConfig.enrichProperties(properties)
        properties = {
          ...properties,
          ...enrichedProps,
        }
      }

      // Apply Mixpanel-specific transformation if provided
      if (eventConfig.transform) {
        const transformedProps = eventConfig.transform(properties)
        properties = {
          ...properties,
          ...transformedProps,
        }
      }

      const cleanedProperties = this.cleanProperties(properties)

      // Use Mixpanel-specific event name if provided, otherwise use the event name
      const eventName = eventConfig.eventName || event.name

      mixpanel.track(eventName, cleanedProperties)

      if (this.config.debug) {
        console.group(`[MixpanelProvider] Event: ${eventName}`)
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

      if (traits) {
        const cleanedTraits = this.cleanProperties(traits)
        mixpanel.people.set(cleanedTraits)
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
      this.userProperties[key] = cleanedValue
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
    this.globalProperties[key] = cleanedValue

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

  isTrackingEnabled(): boolean {
    if (!this.isInitialized) {
      return false
    }

    try {
      return mixpanel.has_opted_in_tracking()
    } catch {
      return false
    }
  }

  getUserProperties(): Record<string, any> {
    return { ...this.userProperties }
  }

  getGlobalProperties(): Record<string, any> {
    return { ...this.globalProperties }
  }

  trackSignup(userId: string, properties?: Record<string, any>): void {
    if (!this.isInitialized || !this.config.enabled) {
      return
    }

    try {
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

  incrementUserProperty(property: string, value: number = 1): void {
    if (!this.isInitialized || !this.config.enabled) {
      return
    }

    try {
      mixpanel.people.increment(property, value)

      if (typeof this.userProperties[property] === 'number') {
        this.userProperties[property] += value
      } else {
        this.userProperties[property] = value
      }
    } catch (error) {
      console.error('[MixpanelProvider] Failed to increment user property:', error)
    }
  }

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

  reset(): void {
    if (!this.isInitialized) {
      return
    }

    try {
      mixpanel.reset()
      this.userProperties = {}
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

  private cleanProperties(properties: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {}

    Object.entries(properties).forEach(([key, value]) => {
      cleaned[key] = this.cleanValue(value)
    })

    return cleaned
  }

  private cleanValue(value: any): any {
    if (value === null || value === undefined) {
      return null
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value
    }

    if (value instanceof Date) {
      return value.toISOString()
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.cleanValue(item))
    }

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
