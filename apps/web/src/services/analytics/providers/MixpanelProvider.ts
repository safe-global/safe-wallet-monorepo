/**
 * Mixpanel provider adapter for the analytics abstraction layer.
 * Direct Mixpanel integration with event name normalization and payload transformation.
 */

import type { BaseProvider, IdentifyCapable, SafeEventMap, AnalyticsEvent, ProviderInitOptions } from '../core'
import { mixpanelInit, mixpanelTrack, mixpanelIdentify, mixpanelSetUserProperties } from '../mixpanel'
import { PROVIDER } from './constants'
import { EventNormalization, MixpanelTransform, ValidationUtils } from './utils'

export type MixpanelOptions = {
  /** Enable debug mode for development */
  debugMode?: boolean
  /** Mixpanel token override (for testing) */
  token?: string
}

/**
 * Mixpanel provider implementation
 * Flexible event routing without hardcoded whitelist restrictions
 */
export class MixpanelProvider<E extends SafeEventMap = SafeEventMap> implements BaseProvider<E>, IdentifyCapable {
  readonly id = PROVIDER.Mixpanel
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
   * Direct integration with simplified trait transformation
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.enabled || !this.initialized) return

    try {
      mixpanelIdentify(ValidationUtils.sanitizeValue(userId) as string)

      // Set user properties if provided
      if (traits && ValidationUtils.isValidPayload(traits)) {
        const userProperties = MixpanelTransform.transformUserTraits(traits)
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
   * Track events with flexible routing and naming convention normalization
   * No hardcoded whitelist - routing controlled by analytics core
   */
  track(event: AnalyticsEvent): void {
    if (!this.enabled || !this.initialized) return

    if (!ValidationUtils.isValidEventName(event.name)) {
      console.warn('[Mixpanel Provider] Invalid event name:', event.name)
      return
    }

    try {
      // Normalize event name for Mixpanel (PascalCase)
      const normalizedEventName = EventNormalization.toPascalCase(event.name)

      // Transform payload to Mixpanel format
      const transformedPayload = ValidationUtils.isValidPayload(event.payload)
        ? MixpanelTransform.transformPayload(event.payload)
        : {}

      // Extract context properties
      const contextProperties = MixpanelTransform.extractContextProperties(event.context)

      // Combine all properties
      const allProperties = {
        ...transformedPayload,
        ...contextProperties,
      }

      // Track the event
      mixpanelTrack(normalizedEventName, Object.keys(allProperties).length > 0 ? allProperties : undefined)

      if (this.debugMode) {
        console.info('[Mixpanel Provider] Event tracked:', {
          original: event.name,
          normalized: normalizedEventName,
          properties: allProperties,
        })
      }
    } catch (error) {
      console.error('[Mixpanel Provider] Failed to track event:', error)
      throw error
    }
  }

  async flush(): Promise<void> {
    // Mixpanel doesn't require explicit flushing in browser environment
    return Promise.resolve()
  }

  shutdown(): Promise<void> {
    // Clean shutdown
    this.enabled = false
    this.initialized = false
    return Promise.resolve()
  }
}
