import type { EventConfiguration } from '../core/types'
import { StandardEvents, PropertyKeys } from '../core/types'
import { MixPanelEvent, MixPanelEventParams } from '../mixpanel-events'
import packageJson from '../../../../package.json'

/**
 * Event configurations mapping
 */
export const ANALYTICS_EVENTS: Record<string, EventConfiguration> = {
  // Safe Lifecycle Events
  [StandardEvents.SAFE_CREATED]: {
    name: 'safe_created',
    providers: {
      ga: {
        enabled: true,
        eventName: 'safe_created',
        registeredParams: [
          PropertyKeys.CHAIN_ID,
          PropertyKeys.DEPLOYMENT_TYPE,
          PropertyKeys.PAYMENT_METHOD,
          PropertyKeys.THRESHOLD,
          PropertyKeys.NUM_OWNERS,
          PropertyKeys.SAFE_VERSION,
        ],
        transform: (properties) => ({
          ...properties,
          // Ensure consistent formatting for GA
          [PropertyKeys.CHAIN_ID]: String(properties[PropertyKeys.CHAIN_ID] || ''),
          [PropertyKeys.THRESHOLD]: Number(properties[PropertyKeys.THRESHOLD] || 0),
          [PropertyKeys.NUM_OWNERS]: Number(properties[PropertyKeys.NUM_OWNERS] || 0),
        }),
      },
      mixpanel: {
        enabled: true,
        eventName: MixPanelEvent.SAFE_CREATED,
        enrichProperties: (properties) => ({
          ...properties,
          // Mixpanel gets all properties plus enrichments
          creation_timestamp: Date.now(),
          app_version: packageJson.version,
          creation_source: 'web-app',
          // Include detailed deployment information
          is_counterfactual: properties[PropertyKeys.DEPLOYMENT_TYPE] === 'counterfactual',
          estimated_gas_cost: properties.estimated_gas_cost,
          actual_gas_cost: properties.actual_gas_cost,
          creation_duration_ms: properties.creation_duration_ms,
          network_name: properties.network_name,
          user_experience_flow: properties.user_experience_flow,
        }),
      },
    },
  },

  [StandardEvents.SAFE_ACTIVATED]: {
    name: 'safe_activated',
    providers: {
      ga: {
        enabled: true,
        eventName: 'safe_activated',
        registeredParams: [
          PropertyKeys.CHAIN_ID,
          PropertyKeys.SAFE_ADDRESS,
          PropertyKeys.SAFE_VERSION,
          PropertyKeys.DEPLOYMENT_TYPE,
        ],
      },
      mixpanel: {
        enabled: true,
        eventName: MixPanelEvent.SAFE_ACTIVATED,
        enrichProperties: (properties) => ({
          ...properties,
          activation_timestamp: Date.now(),
          time_to_activation_hours: properties.time_to_activation_hours,
          first_transaction_type: properties.first_transaction_type,
        }),
      },
    },
  },

  [StandardEvents.SAFE_OPENED]: {
    name: 'safe_opened',
    providers: {
      ga: {
        enabled: true,
        eventName: 'safe_opened',
        registeredParams: [PropertyKeys.CHAIN_ID, PropertyKeys.SAFE_ADDRESS, PropertyKeys.WALLET_TYPE],
      },
      mixpanel: {
        enabled: false, // Not tracked in Mixpanel to reduce noise
      },
    },
  },

  // Wallet Events
  [StandardEvents.WALLET_CONNECTED]: {
    name: 'wallet_connected',
    providers: {
      ga: {
        enabled: true,
        eventName: 'wallet_connected',
        registeredParams: [PropertyKeys.WALLET_TYPE, PropertyKeys.CHAIN_ID],
      },
      mixpanel: {
        enabled: true,
        eventName: MixPanelEvent.WALLET_CONNECTED,
        enrichProperties: (properties) => ({
          ...properties,
          connection_timestamp: Date.now(),
          connection_method: properties.connection_method || 'unknown',
          wallet_version: properties.wallet_version,
          is_first_connection: properties.is_first_connection || false,
        }),
      },
    },
  },

  [StandardEvents.WALLET_DISCONNECTED]: {
    name: 'wallet_disconnected',
    providers: {
      ga: {
        enabled: true,
        eventName: 'wallet_disconnected',
        registeredParams: [PropertyKeys.WALLET_TYPE],
      },
      mixpanel: {
        enabled: false, // Not tracked to reduce noise
      },
    },
  },

  // Transaction Events
  [StandardEvents.TX_CREATED]: {
    name: 'transaction_created',
    providers: {
      ga: {
        enabled: true,
        eventName: 'tx_created',
        registeredParams: [
          PropertyKeys.TX_TYPE,
          PropertyKeys.CHAIN_ID,
          PropertyKeys.TOKEN_SYMBOL,
          PropertyKeys.SAFE_ADDRESS,
        ],
      },
      mixpanel: {
        enabled: false, // Too frequent for Mixpanel
      },
    },
  },

  [StandardEvents.TX_CONFIRMED]: {
    name: 'transaction_confirmed',
    providers: {
      ga: {
        enabled: true,
        eventName: 'tx_confirmed',
        registeredParams: [PropertyKeys.TX_TYPE, PropertyKeys.CHAIN_ID, PropertyKeys.SAFE_ADDRESS],
      },
      mixpanel: {
        enabled: false, // Too frequent for Mixpanel
      },
    },
  },

  [StandardEvents.TX_EXECUTED]: {
    name: 'transaction_executed',
    providers: {
      ga: {
        enabled: true,
        eventName: 'tx_executed',
        registeredParams: [PropertyKeys.TX_TYPE, PropertyKeys.CHAIN_ID, PropertyKeys.SAFE_ADDRESS],
      },
      mixpanel: {
        enabled: false, // Too frequent for Mixpanel
      },
    },
  },

  [StandardEvents.TX_FAILED]: {
    name: 'transaction_failed',
    providers: {
      ga: {
        enabled: true,
        eventName: 'tx_failed',
        registeredParams: [PropertyKeys.TX_TYPE, PropertyKeys.CHAIN_ID],
      },
      mixpanel: {
        enabled: true,
        eventName: 'Transaction Failed',
        enrichProperties: (properties) => ({
          ...properties,
          failure_timestamp: Date.now(),
          error_code: properties.error_code,
          error_message: properties.error_message,
          gas_estimation_error: properties.gas_estimation_error,
          user_rejected: properties.user_rejected || false,
        }),
      },
    },
  },

  // Safe App Events
  [StandardEvents.SAFE_APP_LAUNCHED]: {
    name: 'safe_app_launched',
    providers: {
      ga: {
        enabled: true,
        eventName: 'safe_app_opened',
        registeredParams: [PropertyKeys.SAFE_APP_NAME, PropertyKeys.LAUNCH_LOCATION, PropertyKeys.CHAIN_ID],
      },
      mixpanel: {
        enabled: true,
        eventName: MixPanelEvent.SAFE_APP_LAUNCHED,
        enrichProperties: (properties) => ({
          ...properties,
          launch_timestamp: Date.now(),
          app_version: packageJson.version,
          safe_app_url: properties[PropertyKeys.SAFE_APP_URL],
          safe_app_tags: properties.safe_app_tags,
          is_custom_app: properties.is_custom_app || false,
          previous_apps_used: properties.previous_apps_used || [],
          // Use chain name for Mixpanel's Blockchain Network property
          [MixPanelEventParams.BLOCKCHAIN_NETWORK]: properties.chain_name || 'Unknown',
        }),
      },
    },
  },

  [StandardEvents.SAFE_APP_TRANSACTION]: {
    name: 'safe_app_transaction',
    providers: {
      ga: {
        enabled: true,
        eventName: 'safe_app_tx',
        registeredParams: [PropertyKeys.SAFE_APP_NAME, PropertyKeys.TX_TYPE, PropertyKeys.CHAIN_ID],
      },
      mixpanel: {
        enabled: true,
        eventName: 'Safe App Transaction',
        enrichProperties: (properties) => ({
          ...properties,
          transaction_timestamp: Date.now(),
          sdk_version: properties.sdk_version,
          transaction_value: properties.transaction_value,
          gas_estimate: properties.gas_estimate,
        }),
      },
    },
  },

  // Navigation Events
  [StandardEvents.PAGE_VIEW]: {
    name: 'page_view',
    providers: {
      ga: {
        enabled: true,
        eventName: 'page_view',
        registeredParams: [PropertyKeys.CHAIN_ID, PropertyKeys.SAFE_ADDRESS],
      },
      mixpanel: {
        enabled: false, // Page views are too frequent for Mixpanel
      },
    },
  },

  [StandardEvents.BUTTON_CLICK]: {
    name: 'button_click',
    providers: {
      ga: {
        enabled: true,
        eventName: 'click',
        registeredParams: [PropertyKeys.CHAIN_ID],
        transform: (properties) => ({
          ...properties,
          // Ensure button_name is included as GA parameter
          button_name: properties.button_name || 'unknown',
        }),
      },
      mixpanel: {
        enabled: false, // Too frequent for Mixpanel
      },
    },
  },

  [StandardEvents.MODAL_OPENED]: {
    name: 'modal_opened',
    providers: {
      ga: {
        enabled: true,
        eventName: 'modal_view',
        registeredParams: [PropertyKeys.CHAIN_ID],
      },
      mixpanel: {
        enabled: false, // Too frequent for Mixpanel
      },
    },
  },

  // Feature Usage Events
  [StandardEvents.FEATURE_USED]: {
    name: 'feature_used',
    providers: {
      ga: {
        enabled: true,
        eventName: 'feature_usage',
        registeredParams: [PropertyKeys.CHAIN_ID, PropertyKeys.SAFE_ADDRESS],
      },
      mixpanel: {
        enabled: true,
        eventName: 'Feature Used',
        enrichProperties: (properties) => ({
          ...properties,
          usage_timestamp: Date.now(),
          feature_category: properties.feature_category,
          user_segment: properties.user_segment,
          is_first_use: properties.is_first_use || false,
        }),
      },
    },
  },

  [StandardEvents.ERROR_OCCURRED]: {
    name: 'error_occurred',
    providers: {
      ga: {
        enabled: true,
        eventName: 'error',
        registeredParams: [PropertyKeys.CHAIN_ID],
        transform: (properties) => ({
          ...properties,
          error_type: properties.error_type || 'unknown',
          error_severity: properties.error_severity || 'medium',
        }),
      },
      mixpanel: {
        enabled: true,
        eventName: 'Error Occurred',
        enrichProperties: (properties) => ({
          ...properties,
          error_timestamp: Date.now(),
          error_stack: properties.error_stack,
          error_component: properties.error_component,
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          page_url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        }),
      },
    },
  },
}

/**
 * Helper function to get event configuration
 */
export function getEventConfig(eventKey: string): EventConfiguration | undefined {
  return ANALYTICS_EVENTS[eventKey]
}

/**
 * Helper function to check if an event is configured for a specific provider
 */
export function isEventEnabledForProvider(eventKey: string, providerName: 'ga' | 'mixpanel'): boolean {
  const config = ANALYTICS_EVENTS[eventKey]
  return config?.providers[providerName]?.enabled || false
}

/**
 * Get all events that are enabled for a specific provider
 */
export function getEventsForProvider(providerName: 'ga' | 'mixpanel'): string[] {
  return Object.keys(ANALYTICS_EVENTS).filter((eventKey) => isEventEnabledForProvider(eventKey, providerName))
}

/**
 * Validate event configuration at build time
 */
export function validateEventConfigurations(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  Object.entries(ANALYTICS_EVENTS).forEach(([eventKey, config]) => {
    // Check if event has at least one provider enabled
    const hasEnabledProvider = Object.values(config.providers).some((provider) => provider?.enabled)
    if (!hasEnabledProvider) {
      errors.push(`Event ${eventKey} has no enabled providers`)
    }

    // Validate GA configuration
    if (config.providers.ga?.enabled) {
      if (!config.providers.ga.eventName) {
        errors.push(`Event ${eventKey} GA config missing eventName`)
      }
      if (!config.providers.ga.registeredParams || config.providers.ga.registeredParams.length === 0) {
        errors.push(`Event ${eventKey} GA config has no registered parameters`)
      }
    }

    // Validate Mixpanel configuration
    if (config.providers.mixpanel?.enabled) {
      if (!config.providers.mixpanel.eventName) {
        errors.push(`Event ${eventKey} Mixpanel config missing eventName`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
