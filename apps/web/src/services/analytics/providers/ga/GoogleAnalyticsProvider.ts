/**
 * Google Analytics Provider
 *
 * Implements the AnalyticsProvider interface for Google Analytics 4.
 * This provider handles GA4-specific requirements:
 * - Parameter filtering (only registered parameters are sent)
 * - Event name formatting
 * - Value transformation for GA4 compatibility
 */

import { sendGAEvent } from '@next/third-parties/google'
import { IS_PRODUCTION } from '@/config/constants'
import type { AnalyticsProvider, AnalyticsEvent } from '../../core/types'
import { GAParameterRegistry } from './GAParameterRegistry'
import { DeviceType } from '../../types'
import packageJson from '../../../../../package.json'

export interface GAConfig {
  trackingId: string
  debug?: boolean
  enabled?: boolean
}

export class GoogleAnalyticsProvider implements AnalyticsProvider {
  public readonly name = 'ga'

  private parameterRegistry: GAParameterRegistry
  private config: GAConfig
  private isInitialized = false
  private globalProperties: Record<string, any> = {}
  private userProperties: Record<string, any> = {}

  constructor(config: GAConfig) {
    this.config = {
      debug: !IS_PRODUCTION,
      enabled: true,
      ...config,
    }
    this.parameterRegistry = new GAParameterRegistry()

    // Set default global properties
    this.setDefaultGlobalProperties()
  }

  initialize(): void {
    if (this.isInitialized || !this.config.enabled) {
      return
    }

    // GA4 is initialized by Next.js third-parties package
    // We just need to set up our consent and configuration
    this.setupConsent()
    this.isInitialized = true

    if (this.config.debug) {
      console.info('[GoogleAnalyticsProvider] Initialized with tracking ID:', this.config.trackingId)
    }
  }

  track(event: AnalyticsEvent): void {
    if (!this.isInitialized || !this.config.enabled) {
      if (this.config.debug) {
        console.warn('[GoogleAnalyticsProvider] Provider not initialized or disabled')
      }
      return
    }

    try {
      // Combine all properties
      const allProperties = {
        ...this.globalProperties,
        ...event.properties,
      }

      // Filter to only registered parameters
      const filteredProperties = this.parameterRegistry.filterParameters(allProperties)

      // Send event to GA4
      sendGAEvent('event', event.name, {
        send_to: this.config.trackingId,
        ...filteredProperties,
      })

      if (this.config.debug) {
        const paramInfo = this.parameterRegistry.getParameterInfo(allProperties)
        console.group(`[GoogleAnalyticsProvider] Event: ${event.name}`)
        console.log('Registered properties sent:', paramInfo.registered)
        if (paramInfo.unregistered.length > 0) {
          console.warn('Unregistered properties filtered:', paramInfo.unregistered)
        }
        console.groupEnd()
      }
    } catch (error) {
      console.error('[GoogleAnalyticsProvider] Failed to track event:', error)
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.isInitialized || !this.config.enabled) {
      return
    }

    try {
      // Set user ID in GA4
      window.gtag?.('config', this.config.trackingId, {
        user_id: userId,
      })

      // Set user properties if provided
      if (traits) {
        Object.entries(traits).forEach(([key, value]) => {
          this.setUserProperty(key, value)
        })
      }

      if (this.config.debug) {
        console.info('[GoogleAnalyticsProvider] User identified:', userId, traits)
      }
    } catch (error) {
      console.error('[GoogleAnalyticsProvider] Failed to identify user:', error)
    }
  }

  setUserProperty(key: string, value: any): void {
    if (!this.isInitialized || !this.config.enabled) {
      return
    }

    try {
      // Store locally
      this.userProperties[key] = value

      // Set in GA4
      window.gtag?.('set', 'user_properties', {
        [key]: value,
      })

      if (this.config.debug) {
        console.info('[GoogleAnalyticsProvider] User property set:', key, '=', value)
      }
    } catch (error) {
      console.error('[GoogleAnalyticsProvider] Failed to set user property:', error)
    }
  }

  setGlobalProperty(key: string, value: any): void {
    // Only set if it's a registered parameter
    if (this.parameterRegistry.isRegistered(key)) {
      this.globalProperties[key] = value

      if (this.config.debug) {
        console.info('[GoogleAnalyticsProvider] Global property set:', key, '=', value)
      }
    } else if (this.config.debug) {
      console.warn(`[GoogleAnalyticsProvider] Cannot set unregistered global property: ${key}`)
    }
  }

  setTrackingEnabled(enabled: boolean): void {
    this.config.enabled = enabled

    if (!enabled) {
      // Disable GA4 tracking
      window.gtag?.('consent', 'update', {
        analytics_storage: 'denied',
      })
    } else {
      // Enable GA4 tracking
      window.gtag?.('consent', 'update', {
        analytics_storage: 'granted',
      })
    }

    if (this.config.debug) {
      console.info('[GoogleAnalyticsProvider] Tracking enabled:', enabled)
    }
  }

  isReady(): boolean {
    return this.isInitialized && !!window.gtag
  }

  /**
   * Get information about registered vs unregistered parameters
   */
  getParameterInfo(properties: Record<string, any> = {}) {
    return this.parameterRegistry.getParameterInfo(properties)
  }

  /**
   * Get all registered parameters
   */
  getRegisteredParameters(): string[] {
    return this.parameterRegistry.getRegisteredParameters()
  }

  /**
   * Check if a parameter is registered
   */
  isParameterRegistered(parameter: string): boolean {
    return this.parameterRegistry.isRegistered(parameter)
  }

  private setDefaultGlobalProperties(): void {
    // Set common properties that should be included with all events
    this.globalProperties = {
      app_version: packageJson.version,
      device_type: this.getDeviceType(),
    }
  }

  private getDeviceType(): DeviceType {
    if (typeof window === 'undefined') {
      return DeviceType.DESKTOP
    }

    const userAgent = navigator.userAgent
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      return /iPad/.test(userAgent) ? DeviceType.TABLET : DeviceType.MOBILE
    }
    return DeviceType.DESKTOP
  }

  private setupConsent(): void {
    // Set default consent state
    window.gtag?.('consent', 'default', {
      analytics_storage: 'denied', // Start with denied, will be updated based on user consent
      ad_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
    })

    if (this.config.debug) {
      console.info('[GoogleAnalyticsProvider] Consent configured')
    }
  }

  /**
   * Enable analytics storage consent
   */
  enableConsent(): void {
    window.gtag?.('consent', 'update', {
      analytics_storage: 'granted',
    })

    if (this.config.debug) {
      console.info('[GoogleAnalyticsProvider] Consent granted')
    }
  }

  /**
   * Disable analytics storage consent
   */
  disableConsent(): void {
    window.gtag?.('consent', 'update', {
      analytics_storage: 'denied',
    })

    if (this.config.debug) {
      console.info('[GoogleAnalyticsProvider] Consent denied')
    }
  }

  /**
   * Track a page view
   */
  trackPageView(path: string, title?: string): void {
    if (!this.isInitialized || !this.config.enabled) {
      return
    }

    try {
      window.gtag?.('config', this.config.trackingId, {
        page_title: title,
        page_location: `${window.location.origin}${path}`,
        page_path: path,
      })

      if (this.config.debug) {
        console.info('[GoogleAnalyticsProvider] Page view tracked:', path)
      }
    } catch (error) {
      console.error('[GoogleAnalyticsProvider] Failed to track page view:', error)
    }
  }

  /**
   * Set common Safe-related properties
   */
  setSafeContext(safeAddress: string, chainId: string, safeVersion?: string): void {
    this.setGlobalProperty('safe_address', safeAddress.toLowerCase())
    this.setGlobalProperty('chain_id', chainId)
    if (safeVersion) {
      this.setGlobalProperty('safe_version', safeVersion)
    }
  }

  /**
   * Set wallet-related properties
   */
  setWalletContext(walletType: string, walletAddress?: string): void {
    this.setGlobalProperty('wallet_type', walletType)
    if (walletAddress) {
      this.setGlobalProperty('wallet_address', walletAddress.toLowerCase())
    }
  }
}
