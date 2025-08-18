/**
 * Google Analytics provider adapter for the analytics abstraction layer.
 * Direct GA4 integration with event name normalization and payload transformation.
 */

import type {
  BaseProvider,
  IdentifyCapable,
  PageCapable,
  SafeEventMap,
  AnalyticsEvent,
  ProviderInitOptions,
  PageContext,
  EventContext,
} from '../core'
import { sendGAEvent } from '@next/third-parties/google'
import { GA_TRACKING_ID, IS_PRODUCTION } from '@/config/constants'
import { PROVIDER, type ProviderId } from './constants'
import { EventNormalization, GA4Transform, ValidationUtils } from './utils'
import { getAbTest } from '@/services/tracking/abTesting'
import packageJson from '../../../../package.json'

export type GoogleAnalyticsOptions = {
  measurementId?: string
  debugMode?: boolean
  providerId?: ProviderId // Allow custom provider ID for routing
  gtag?: (...args: any[]) => void // For dependency injection in tests
}

/**
 * Google Analytics provider implementation
 * Direct GA4 integration without legacy wrapper dependencies
 */
export class GoogleAnalyticsProvider<E extends SafeEventMap = SafeEventMap>
  implements BaseProvider<E>, IdentifyCapable, PageCapable
{
  readonly id: ProviderId
  private enabled = true
  private gtag?: (...args: any[]) => void
  private measurementId: string
  private debugMode: boolean

  constructor(options: GoogleAnalyticsOptions = {}) {
    this.id = options.providerId || PROVIDER.GA
    this.measurementId = options.measurementId || GA_TRACKING_ID
    this.debugMode = options.debugMode ?? !IS_PRODUCTION
    this.gtag = options.gtag || (typeof window !== 'undefined' ? window.gtag : undefined)
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  init(opts?: ProviderInitOptions): void {
    if (!this.gtag) {
      console.warn('[GA Provider] gtag not found. Ensure GA script is loaded.')
      return
    }

    // Configure GA with manual page view control for SPA
    this.gtag('config', this.measurementId, {
      send_page_view: false,
      debug_mode: this.debugMode,
    })

    // Set up initial context if provided
    if (opts?.defaultContext) {
      if (opts.defaultContext.userId) {
        this.identify(opts.defaultContext.userId)
      }
    }

    if (this.debugMode) {
      console.info('[GA Provider] Initialized with measurement ID:', this.measurementId)
    }
  }

  /**
   * Set user ID for cross-session tracking
   * Direct GA4 configuration without legacy wrapper
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.enabled || !this.gtag) return

    // Set user ID through config to ensure it applies to all events
    this.gtag('config', this.measurementId, {
      user_id: ValidationUtils.sanitizeValue(userId),
      send_page_view: false, // Prevent automatic page view
    })

    // Set user properties if provided
    if (traits && ValidationUtils.isValidPayload(traits)) {
      const transformedTraits = GA4Transform.transformPayload(traits)

      for (const [key, value] of Object.entries(transformedTraits)) {
        this.gtag('set', 'user_properties', {
          [key]: ValidationUtils.sanitizeValue(value),
        })
      }
    }

    if (this.debugMode) {
      console.info('[GA Provider] User identified:', { userId, traits })
    }
  }

  /**
   * Track page views with context
   * Direct GA4 page_view event using sendGAEvent for consistency
   */
  page(pageContext?: PageContext & EventContext): void {
    if (!this.enabled) return

    const pagePath = pageContext?.path || (typeof location !== 'undefined' ? location.pathname : '')
    const pageUrl = pageContext?.url || (typeof location !== 'undefined' ? location.href : '')
    const pageTitle = pageContext?.title || (typeof document !== 'undefined' ? document.title : '')

    // Extract context parameters for additional properties (excluding page props to avoid duplication)
    const contextParams = GA4Transform.extractContextParams(pageContext)

    // Get A/B test data
    const abTest = getAbTest()

    // Combine all event data with proper GA4 standard properties
    const eventData: Record<string, unknown> = {
      page_title: pageTitle,
      page_location: pageUrl,
      page_path: pagePath,
      ...contextParams,
      app_version: packageJson.version,
      send_to: this.measurementId,
    }

    // Add A/B test data if available
    if (abTest) {
      eventData.abTest = abTest
    }

    // Send GA4 page_view event using sendGAEvent for consistency with track()
    sendGAEvent('event', 'page_view', eventData)

    if (this.debugMode) {
      console.info('[GA Provider] Page view tracked:', {
        title: pageTitle,
        path: pagePath,
        url: pageUrl,
        context: contextParams,
      })
    }
  }

  /**
   * Track events with direct GA4 integration
   * Simple, clean implementation without legacy wrapper dependencies
   */
  track(event: AnalyticsEvent): void {
    if (!this.enabled || !this.gtag) return

    if (!ValidationUtils.isValidEventName(event.name)) {
      console.warn('[GA Provider] Invalid event name:', event.name)
      return
    }

    try {
      // Normalize event name for GA4 (snake_case, max 40 chars)
      const normalizedEventName = EventNormalization.toSnakeCase(event.name)

      // Transform payload to GA4 format
      const transformedPayload = ValidationUtils.isValidPayload(event.payload)
        ? GA4Transform.transformPayload(event.payload)
        : {}

      // Extract context parameters
      const contextParams = GA4Transform.extractContextParams(event.context)

      // Get A/B test data (matches legacy gtmTrack behavior)
      const abTest = getAbTest()

      // Combine all event data
      const eventData: Record<string, unknown> = {
        ...transformedPayload,
        ...contextParams,
        // Standard GA4 parameters
        app_version: packageJson.version,
        send_to: this.measurementId,
      }

      // Add A/B test data if available (same field name as legacy)
      if (abTest) {
        eventData.abTest = abTest
      }

      // Send to GA4
      sendGAEvent('event', normalizedEventName, eventData)

      if (this.debugMode) {
        console.info('[GA Provider] Event tracked:', {
          original: event.name,
          normalized: normalizedEventName,
          data: eventData,
        })
      }
    } catch (error) {
      console.error('[GA Provider] Failed to track event:', error)
      throw error // Re-throw so the analytics system can handle retries
    }
  }

  async flush(): Promise<void> {
    // GA4 doesn't require explicit flushing, events are sent immediately
    return Promise.resolve()
  }

  shutdown(): Promise<void> {
    // Clean shutdown
    this.enabled = false
    return Promise.resolve()
  }
}
