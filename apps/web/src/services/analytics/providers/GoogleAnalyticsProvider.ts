/**
 * Google Analytics provider adapter for the analytics abstraction layer.
 * Wraps the existing GTM implementation while conforming to provider interface.
 */

import type {
  BaseProvider,
  IdentifyCapable,
  PageCapable,
  SafeEventMap,
  AnalyticsEvent,
  ProviderInitOptions,
  PageContext,
} from '../core'
import { gtmSetChainId, gtmSetDeviceType, gtmSetSafeAddress, gtmSetUserProperty, gtmTrackPageview } from '../gtm'
import { sendGAEvent } from '@next/third-parties/google'
import { GA_TRACKING_ID, IS_PRODUCTION } from '@/config/constants'
import type { EventType, DeviceType, AnalyticsEvent as LegacyAnalyticsEvent } from '../types'
import { DeviceType as LegacyDeviceType } from '../types'
import packageJson from '../../../../package.json'

export type GoogleAnalyticsOptions = {
  measurementId?: string
  debugMode?: boolean
  gtag?: (...args: any[]) => void // For dependency injection in tests
}

/**
 * Google Analytics provider implementation
 * Adapts existing GTM functionality to the new provider interface
 */
export class GoogleAnalyticsProvider<E extends SafeEventMap = SafeEventMap>
  implements BaseProvider<E>, IdentifyCapable, PageCapable
{
  readonly id = 'ga'
  private enabled = true
  private gtag?: (...args: any[]) => void
  private measurementId: string
  private debugMode: boolean

  constructor(options: GoogleAnalyticsOptions = {}) {
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
   * Uses GTM config to ensure ID applies to all subsequent events
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!this.enabled || !this.gtag) return

    // Set user ID through config to ensure it applies to all events
    this.gtag('config', this.measurementId, {
      user_id: userId,
      send_page_view: false, // Prevent automatic page view
    })

    // Set user properties if provided
    if (traits) {
      for (const [key, value] of Object.entries(traits)) {
        gtmSetUserProperty(key, String(value))
      }
    }

    if (this.debugMode) {
      console.info('[GA Provider] User identified:', { userId, traits })
    }
  }

  /**
   * Track page views with context
   */
  page(context?: PageContext): void {
    if (!this.enabled || !this.gtag) return

    const pagePath = context?.path || location.pathname
    const fullUrl = context?.url || location.href

    gtmTrackPageview(pagePath, fullUrl)

    if (this.debugMode) {
      console.info('[GA Provider] Page view tracked:', { path: pagePath, url: fullUrl })
    }
  }

  /**
   * Convert new event format to legacy GA event format
   */
  private convertToLegacyEvent(event: AnalyticsEvent): LegacyAnalyticsEvent {
    // Extract chainId from context or payload
    const chainId = (event.context as any)?.chainId || (event.payload as any)?.chainId || ''

    // Map common event types or use event name
    const eventType = this.mapEventType(event.name)

    return {
      event: eventType,
      category: this.extractCategory(event.name),
      action: this.extractAction(event.name),
      label: this.extractLabel(event.payload),
      chainId,
    }
  }

  /**
   * Map event names to legacy EventType enum values
   */
  private mapEventType(eventName: string): EventType | undefined {
    const lowercaseName = eventName.toLowerCase()

    // Map common patterns to existing event types
    if (lowercaseName.includes('safe_created') || lowercaseName.includes('safe created')) {
      return 'safe_created' as EventType
    }
    if (lowercaseName.includes('safe_activated') || lowercaseName.includes('safe activated')) {
      return 'safe_activated' as EventType
    }
    if (lowercaseName.includes('safe_opened') || lowercaseName.includes('safe opened')) {
      return 'safe_opened' as EventType
    }
    if (lowercaseName.includes('wallet_connected') || lowercaseName.includes('wallet connected')) {
      return 'wallet_connected' as EventType
    }
    if (lowercaseName.includes('tx_created') || lowercaseName.includes('transaction created')) {
      return 'tx_created' as EventType
    }
    if (lowercaseName.includes('tx_confirmed') || lowercaseName.includes('transaction confirmed')) {
      return 'tx_confirmed' as EventType
    }
    if (lowercaseName.includes('tx_executed') || lowercaseName.includes('transaction executed')) {
      return 'tx_executed' as EventType
    }
    if (lowercaseName.includes('page') || lowercaseName.includes('pageview')) {
      return 'pageview' as EventType
    }
    if (lowercaseName.includes('safe_app') || lowercaseName.includes('safeapp') || lowercaseName.includes('safe app')) {
      return 'safeApp' as EventType
    }

    // Default to customClick for user interactions
    return 'customClick' as EventType
  }

  /**
   * Extract category from event name
   */
  private extractCategory(eventName: string): string {
    const lowercaseName = eventName.toLowerCase()

    if (lowercaseName.includes('safe') && lowercaseName.includes('app')) {
      return 'safe'
    }
    if (lowercaseName.includes('wallet')) {
      return 'wallet'
    }
    if (lowercaseName.includes('transaction') || lowercaseName.includes('tx')) {
      return 'transaction'
    }
    if (lowercaseName.includes('safe')) {
      return 'safe'
    }

    // Use first part of PascalCase or snake_case name as category
    const parts = eventName.split(/[\s_]|(?=[A-Z])/)
    return parts[0].toLowerCase() || 'general'
  }

  /**
   * Extract action from event name and payload
   */
  private extractAction(eventName: string): string {
    // Use the full event name as action, cleaned up
    return eventName
      .replace(/([a-z])([A-Z])/g, '$1 $2') // PascalCase to space-separated
      .replace(/_/g, ' ') // underscores to spaces
      .toLowerCase()
  }

  /**
   * Extract label from payload
   */
  private extractLabel(payload: any): string | undefined {
    if (!payload || typeof payload !== 'object') return undefined

    // Look for common label fields
    const labelFields = ['label', 'name', 'type', 'method', 'action', 'status']

    for (const field of labelFields) {
      if (payload[field] !== undefined) {
        return String(payload[field])
      }
    }

    return undefined
  }

  /**
   * Track events through existing GTM infrastructure
   */
  track(event: AnalyticsEvent): void {
    if (!this.enabled || !this.gtag) return

    try {
      // Convert to legacy event format
      const legacyEvent = this.convertToLegacyEvent(event)

      // Use existing gtmTrack logic but bypass the wrapper
      const eventData = {
        ...legacyEvent,
        appVersion: packageJson.version,
        deviceType: LegacyDeviceType.DESKTOP, // Will be overridden by device detection
        safeAddress: (event.context as any)?.safeAddress?.replace(/^0x/, '') || '', // Remove 0x prefix
        send_to: this.measurementId,
      }

      // Send to GA
      sendGAEvent('event', legacyEvent.event || 'custom_event', eventData)

      if (this.debugMode) {
        console.info('[GA Provider] Event tracked:', { original: event, converted: eventData })
      }
    } catch (error) {
      console.error('[GA Provider] Failed to track event:', error)
      throw error // Re-throw so the analytics system can handle retries
    }
  }

  /**
   * Update provider configuration with context changes
   */
  updateContext(context: { chainId?: string; deviceType?: DeviceType; safeAddress?: string }): void {
    if (context.chainId) {
      gtmSetChainId(context.chainId)
    }

    if (context.deviceType) {
      gtmSetDeviceType(context.deviceType)
    }

    if (context.safeAddress) {
      gtmSetSafeAddress(context.safeAddress)
    }
  }

  async flush(): Promise<void> {
    // GA doesn't require explicit flushing, events are sent immediately
    return Promise.resolve()
  }

  shutdown(): Promise<void> {
    // No cleanup required for GA
    this.enabled = false
    return Promise.resolve()
  }
}
