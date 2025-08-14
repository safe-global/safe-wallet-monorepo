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

    this.setDefaultGlobalProperties()
  }

  initialize(): void {
    if (this.isInitialized || !this.config.enabled) {
      return
    }

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
      const allProperties = {
        ...this.globalProperties,
        ...event.properties,
      }

      const filteredProperties = this.parameterRegistry.filterParameters(allProperties)

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
      window.gtag?.('config', this.config.trackingId, {
        user_id: userId,
      })

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
      this.userProperties[key] = value

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
      window.gtag?.('consent', 'update', {
        analytics_storage: 'denied',
      })
    } else {
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

  getParameterInfo(properties: Record<string, any> = {}) {
    return this.parameterRegistry.getParameterInfo(properties)
  }

  getRegisteredParameters(): string[] {
    return this.parameterRegistry.getRegisteredParameters()
  }

  isParameterRegistered(parameter: string): boolean {
    return this.parameterRegistry.isRegistered(parameter)
  }

  private setDefaultGlobalProperties(): void {
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

  enableConsent(): void {
    window.gtag?.('consent', 'update', {
      analytics_storage: 'granted',
    })

    if (this.config.debug) {
      console.info('[GoogleAnalyticsProvider] Consent granted')
    }
  }

  disableConsent(): void {
    window.gtag?.('consent', 'update', {
      analytics_storage: 'denied',
    })

    if (this.config.debug) {
      console.info('[GoogleAnalyticsProvider] Consent denied')
    }
  }

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

  setSafeContext(safeAddress: string, chainId: string, safeVersion?: string): void {
    this.setGlobalProperty('safe_address', safeAddress.toLowerCase())
    this.setGlobalProperty('chain_id', chainId)
    if (safeVersion) {
      this.setGlobalProperty('safe_version', safeVersion)
    }
  }

  setWalletContext(walletType: string, walletAddress?: string): void {
    this.setGlobalProperty('wallet_type', walletType)
    if (walletAddress) {
      this.setGlobalProperty('wallet_address', walletAddress.toLowerCase())
    }
  }
}
