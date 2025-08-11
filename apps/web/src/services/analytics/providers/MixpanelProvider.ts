/**
 * Mixpanel provider adapter for the analytics abstraction layer.
 * Wraps the existing Mixpanel implementation with event filtering and naming convention enforcement.
 */

import type { BaseProvider, IdentifyCapable, SafeEventMap, AnalyticsEvent, ProviderInitOptions } from '../core'
import {
  mixpanelInit,
  mixpanelTrack,
  mixpanelIdentify,
  mixpanelSetBlockchainNetwork,
  mixpanelSetDeviceType,
  mixpanelSetSafeAddress,
  mixpanelSetUserProperties,
} from '../mixpanel'
import { MixPanelEvent } from '../mixpanel-events'
import type { DeviceType } from '../types'

export type MixpanelOptions = {
  // Enable debug mode for development
  debugMode?: boolean
  // Mixpanel token override (for testing)
  token?: string
}

/**
 * Whitelisted events that are allowed to be sent to Mixpanel.
 * Based on current implementation analysis - only "Safe App Launched" is currently tracked.
 */
const MIXPANEL_EVENT_WHITELIST = new Set([
  MixPanelEvent.SAFE_APP_LAUNCHED, // 'Safe App Launched'
])

/**
 * Mixpanel provider implementation with strict event filtering and naming convention enforcement.
 * Only whitelisted events with proper PascalCase naming will be sent to Mixpanel.
 */
export class MixpanelProvider<E extends SafeEventMap = SafeEventMap> implements BaseProvider<E>, IdentifyCapable {
  readonly id = 'mixpanel'
  private enabled = true
  private debugMode: boolean
  private initialized = false

  constructor(options: MixpanelOptions = {}) {
    this.debugMode = options.debugMode ?? process.env.NODE_ENV !== 'production'
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  init(opts?: ProviderInitOptions): void {
    if (this.initialized) {
      return
    }

    try {
      mixpanelInit()
      this.initialized = true

      // Set up initial context if provided
      if (opts?.defaultContext) {
        if (opts.defaultContext.userId) {
          this.identify(opts.defaultContext.userId)
        }
      }

      if (this.debugMode) {
        console.info('[Mixpanel Provider] Initialized successfully')
      }
    } catch (error) {
      console.error('[Mixpanel Provider] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Identify user in Mixpanel with traits as user properties
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.enabled || !this.initialized) return

    try {
      mixpanelIdentify(userId)

      // Set user properties if provided
      if (traits) {
        // Convert traits to Mixpanel user properties format
        const userProperties = this.convertTraitsToUserProperties(traits)
        mixpanelSetUserProperties(userProperties)
      }

      if (this.debugMode) {
        console.info('[Mixpanel Provider] User identified:', { userId, traits })
      }
    } catch (error) {
      console.error('[Mixpanel Provider] Failed to identify user:', error)
      throw error
    }
  }

  /**
   * Convert traits to Mixpanel user properties with proper naming conventions
   */
  private convertTraitsToUserProperties(traits: Record<string, unknown>): Record<string, any> {
    const userProperties: Record<string, any> = {}

    for (const [key, value] of Object.entries(traits)) {
      // Convert to Title Case for Mixpanel user properties
      const propertyName = this.toTitleCase(key)
      userProperties[propertyName] = value
    }

    return userProperties
  }

  /**
   * Convert camelCase or snake_case to Title Case
   */
  private toTitleCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to space-separated
      .replace(/_/g, ' ') // snake_case to space-separated
      .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize first letter of each word
  }

  /**
   * Convert event name to PascalCase for Mixpanel naming conventions
   */
  private toPascalCase(eventName: string): string {
    return eventName
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Handle existing camelCase BEFORE lowercase
      .toLowerCase() // Now convert to lowercase to handle ALL_CAPS
      .replace(/[_-]/g, ' ') // snake_case and kebab-case to space-separated
      .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize each word
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
  }

  /**
   * Check if event is whitelisted for Mixpanel
   */
  private isEventWhitelisted(eventName: string): boolean {
    const pascalCaseEventName = this.toPascalCase(eventName)
    return MIXPANEL_EVENT_WHITELIST.has(pascalCaseEventName as any)
  }

  /**
   * Convert event payload to Mixpanel properties format
   */
  private convertPayloadToMixpanelProperties(payload: any, context?: any): Record<string, any> | undefined {
    if (!payload || typeof payload !== 'object') return undefined

    const properties: Record<string, any> = {}

    // Add payload properties with Title Case naming
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        const propertyName = this.toTitleCase(key)
        properties[propertyName] = value
      }
    }

    // Add context properties if available
    if (context) {
      // Add blockchain network if available
      if (context.chainId) {
        properties['Blockchain Network'] = context.chainId
      }

      // Add Safe address if available
      if (context.safeAddress) {
        properties['Safe Address'] = context.safeAddress
      }
    }

    return Object.keys(properties).length > 0 ? properties : undefined
  }

  /**
   * Track events with strict filtering and naming convention enforcement
   */
  track(event: AnalyticsEvent): void {
    if (!this.enabled || !this.initialized) return

    try {
      const pascalCaseEventName = this.toPascalCase(event.name)

      // Check if event is whitelisted
      if (!this.isEventWhitelisted(event.name)) {
        if (this.debugMode) {
          console.info(
            `[Mixpanel Provider] Event "${event.name}" (normalized: "${pascalCaseEventName}") not whitelisted, skipping`,
          )
        }
        return
      }

      // Convert payload to Mixpanel properties
      const properties = this.convertPayloadToMixpanelProperties(event.payload, event.context)

      // Track the event
      mixpanelTrack(pascalCaseEventName, properties)

      if (this.debugMode) {
        console.info('[Mixpanel Provider] Event tracked:', {
          original: event.name,
          normalized: pascalCaseEventName,
          properties,
        })
      }
    } catch (error) {
      console.error('[Mixpanel Provider] Failed to track event:', error)
      throw error
    }
  }

  /**
   * Update provider configuration with context changes
   */
  updateContext(context: { chainId?: string; deviceType?: DeviceType; safeAddress?: string }): void {
    if (!this.enabled || !this.initialized) return

    try {
      if (context.chainId) {
        mixpanelSetBlockchainNetwork(context.chainId)
      }

      if (context.deviceType) {
        mixpanelSetDeviceType(context.deviceType)
      }

      if (context.safeAddress) {
        mixpanelSetSafeAddress(context.safeAddress)
      }

      if (this.debugMode) {
        console.info('[Mixpanel Provider] Context updated:', context)
      }
    } catch (error) {
      console.error('[Mixpanel Provider] Failed to update context:', error)
    }
  }

  async flush(): Promise<void> {
    // Mixpanel doesn't require explicit flushing in browser environment
    return Promise.resolve()
  }

  shutdown(): Promise<void> {
    this.enabled = false
    this.initialized = false
    return Promise.resolve()
  }
}
