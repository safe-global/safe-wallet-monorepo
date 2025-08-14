/**
 * Core analytics interfaces and types for the unified analytics system.
 *
 * This module defines the contract for analytics providers and events,
 * supporting different provider requirements (GA4 with registered parameters,
 * Mixpanel with dynamic properties).
 */
export interface AnalyticsEvent {
  /** The event name/identifier */
  name: string
  /** Event properties/parameters */
  properties?: Record<string, any>
  /** Additional metadata for internal use */
  metadata?: EventMetadata
}

export interface EventMetadata {
  /** Timestamp when event was created */
  timestamp?: number
  /** Source component or location */
  source?: string
  /** Provider-specific configurations */
  providerConfig?: Record<string, any>
}

/**
 * Base interface that all analytics providers must implement
 */
export interface AnalyticsProvider {
  /** Provider identifier (e.g., 'ga', 'mixpanel') */
  readonly name: string

  /** Initialize the provider */
  initialize(): void

  /** Track an analytics event */
  track(event: AnalyticsEvent): void

  /** Identify a user */
  identify(userId: string, traits?: Record<string, any>): void

  /** Set a user property */
  setUserProperty(key: string, value: any): void

  /** Set a global property that applies to all events */
  setGlobalProperty(key: string, value: any): void

  /** Enable/disable tracking */
  setTrackingEnabled(enabled: boolean): void

  /** Check if provider is initialized and ready */
  isReady(): boolean
}

/**
 * Configuration for how events should be handled by different providers
 */
export interface EventConfiguration {
  /** The canonical event name */
  name: string

  /** Provider-specific configurations */
  providers: {
    ga?: GAProviderConfig
    mixpanel?: MixpanelProviderConfig
  }
}

export interface GAProviderConfig {
  /** Whether this event should be sent to GA */
  enabled: boolean

  /** GA-specific event name (may differ from canonical name) */
  eventName?: string

  /** Only these parameters will be sent to GA (must be pre-registered) */
  registeredParams?: string[]

  /** Optional transformation function for GA-specific formatting */
  transform?: (properties: Record<string, any>) => Record<string, any>
}

export interface MixpanelProviderConfig {
  /** Whether this event should be sent to Mixpanel */
  enabled: boolean

  /** Mixpanel-specific event name (may differ from canonical name) */
  eventName?: string

  /** Optional function to enrich properties for Mixpanel */
  enrichProperties?: (properties: Record<string, any>) => Record<string, any>

  /** Optional transformation function for Mixpanel-specific formatting */
  transform?: (properties: Record<string, any>) => Record<string, any>
}

/**
 * Result of tracking an event, indicating success/failure per provider
 */
export interface TrackingResult {
  success: boolean
  results: Record<string, ProviderResult>
}

export interface ProviderResult {
  success: boolean
  error?: string
  sentProperties?: Record<string, any>
  filteredProperties?: string[]
}

/**
 * Analytics manager configuration
 */
export interface AnalyticsConfig {
  /** Global settings */
  enabled: boolean
  debug: boolean

  /** Provider configurations */
  providers: {
    ga?: {
      enabled: boolean
      trackingId: string
    }
    mixpanel?: {
      enabled: boolean
      token: string
    }
  }

  /** Event configurations */
  events: Record<string, EventConfiguration>
}

/**
 * Standard event keys that components can use
 */
export enum StandardEvents {
  // Safe lifecycle events
  SAFE_CREATED = 'SAFE_CREATED',
  SAFE_ACTIVATED = 'SAFE_ACTIVATED',
  SAFE_OPENED = 'SAFE_OPENED',

  // Wallet events
  WALLET_CONNECTED = 'WALLET_CONNECTED',
  WALLET_DISCONNECTED = 'WALLET_DISCONNECTED',

  // Transaction events
  TX_CREATED = 'TX_CREATED',
  TX_CONFIRMED = 'TX_CONFIRMED',
  TX_EXECUTED = 'TX_EXECUTED',
  TX_FAILED = 'TX_FAILED',

  // Safe App events
  SAFE_APP_LAUNCHED = 'SAFE_APP_LAUNCHED',
  SAFE_APP_TRANSACTION = 'SAFE_APP_TRANSACTION',

  // Navigation events
  PAGE_VIEW = 'PAGE_VIEW',
  BUTTON_CLICK = 'BUTTON_CLICK',
  MODAL_OPENED = 'MODAL_OPENED',

  // Feature usage events
  FEATURE_USED = 'FEATURE_USED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
}

/**
 * Common property keys with consistent naming
 */
export enum PropertyKeys {
  // Safe properties
  SAFE_ADDRESS = 'safe_address',
  CHAIN_ID = 'chain_id',
  SAFE_VERSION = 'safe_version',
  THRESHOLD = 'threshold',
  NUM_OWNERS = 'num_owners',

  // Transaction properties
  TX_HASH = 'tx_hash',
  TX_TYPE = 'tx_type',
  TOKEN_SYMBOL = 'token_symbol',
  TOKEN_ADDRESS = 'token_address',
  AMOUNT = 'amount',

  // Wallet properties
  WALLET_TYPE = 'wallet_type',
  WALLET_ADDRESS = 'wallet_address',

  // App properties
  APP_VERSION = 'app_version',
  DEVICE_TYPE = 'device_type',

  // Safe App properties
  SAFE_APP_NAME = 'safe_app_name',
  SAFE_APP_URL = 'safe_app_url',
  LAUNCH_LOCATION = 'launch_location',

  // Deployment properties
  DEPLOYMENT_TYPE = 'deployment_type',
  PAYMENT_METHOD = 'payment_method',
}

/**
 * Registered GA4 custom parameters
 * These must be pre-configured in the GA4 dashboard
 */
export const GA_REGISTERED_PARAMETERS = [
  PropertyKeys.SAFE_ADDRESS,
  PropertyKeys.CHAIN_ID,
  PropertyKeys.SAFE_VERSION,
  PropertyKeys.THRESHOLD,
  PropertyKeys.NUM_OWNERS,
  PropertyKeys.TX_TYPE,
  PropertyKeys.TOKEN_SYMBOL,
  PropertyKeys.WALLET_TYPE,
  PropertyKeys.APP_VERSION,
  PropertyKeys.DEVICE_TYPE,
  PropertyKeys.SAFE_APP_NAME,
  PropertyKeys.LAUNCH_LOCATION,
  PropertyKeys.DEPLOYMENT_TYPE,
  PropertyKeys.PAYMENT_METHOD,
  // Add more as they are registered in GA4
] as const

export type GARegisteredParameter = (typeof GA_REGISTERED_PARAMETERS)[number]
