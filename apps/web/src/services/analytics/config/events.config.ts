import type { EventConfiguration } from '../core/types'
import { StandardEvents, PropertyKeys } from '../core/types'
import { MixpanelEvents, MixpanelProperties } from '../constants/mixpanel'

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
        eventName: MixpanelEvents.SAFE_CREATED,
        createProperties: (properties) => ({
          [MixpanelProperties.SAFE_ADDRESS]: properties[PropertyKeys.SAFE_ADDRESS],
          [MixpanelProperties.DEPLOYMENT_TYPE]: properties[PropertyKeys.DEPLOYMENT_TYPE],
          [MixpanelProperties.PAYMENT_METHOD]: properties[PropertyKeys.PAYMENT_METHOD],
          [MixpanelProperties.SAFE_VERSION]: properties[PropertyKeys.SAFE_VERSION],
          [MixpanelProperties.NETWORK_NAME]: properties[PropertyKeys.NETWORK_NAME],
          [MixpanelProperties.THRESHOLD_AT_CREATION]:
            properties[PropertyKeys.THRESHOLD_AT_CREATION] || properties[PropertyKeys.THRESHOLD],
          [MixpanelProperties.NUMBER_OF_SIGNERS_AT_CREATION]:
            properties[PropertyKeys.NUMBER_OF_SIGNERS_AT_CREATION] || properties[PropertyKeys.NUM_OWNERS],
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
        eventName: MixpanelEvents.SAFE_ACTIVATED,
        createProperties: (properties) => ({
          [MixpanelProperties.SAFE_ADDRESS]: properties[PropertyKeys.SAFE_ADDRESS],
          [MixpanelProperties.NETWORK_NAME]: properties[PropertyKeys.NETWORK_NAME],
          [MixpanelProperties.DEPLOYMENT_TYPE]: properties[PropertyKeys.DEPLOYMENT_TYPE],
          [MixpanelProperties.ENTRY_POINT]: properties[PropertyKeys.ENTRY_POINT],
          [MixpanelProperties.EOA_WALLET_ADDRESS]: properties[PropertyKeys.WALLET_ADDRESS],
          [MixpanelProperties.EOA_WALLET_LABEL]: properties[PropertyKeys.WALLET_LABEL],
          [MixpanelProperties.EOA_WALLET_NETWORK]: properties[PropertyKeys.WALLET_NETWORK],
          [MixpanelProperties.NUM_OWNERS]: properties[PropertyKeys.NUM_OWNERS],
          [MixpanelProperties.PAYMENT_METHOD]: properties[PropertyKeys.PAYMENT_METHOD],
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
        eventName: MixpanelEvents.WALLET_CONNECTED,
        createProperties: (properties) => ({
          [MixpanelProperties.WALLET_TYPE]: properties[PropertyKeys.WALLET_TYPE],
          [MixpanelProperties.CHAIN_ID]: properties[PropertyKeys.CHAIN_ID],
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
        createProperties: (properties) => ({
          [MixpanelProperties.TRANSACTION_TYPE]: properties[PropertyKeys.TX_TYPE],
          [MixpanelProperties.CHAIN_ID]: properties[PropertyKeys.CHAIN_ID],
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
        registeredParams: [
          PropertyKeys.SAFE_APP_NAME,
          PropertyKeys.LAUNCH_LOCATION,
          PropertyKeys.CHAIN_ID,
          PropertyKeys.NETWORK_NAME,
        ],
      },
      mixpanel: {
        enabled: true,
        eventName: MixpanelEvents.SAFE_APP_LAUNCHED,
        createProperties: (properties) => ({
          [MixpanelProperties.NETWORK_NAME]: properties[PropertyKeys.NETWORK_NAME],
          [MixpanelProperties.SAFE_APP_NAME]: properties[PropertyKeys.SAFE_APP_NAME],
          [MixpanelProperties.SAFE_APP_CATEGORY]: properties[PropertyKeys.SAFE_APP_CATEGORY],
          [MixpanelProperties.ENTRY_POINT]: properties[PropertyKeys.LAUNCH_LOCATION],
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
        createProperties: (properties) => ({
          [MixpanelProperties.SAFE_APP_NAME]: properties[PropertyKeys.SAFE_APP_NAME],
          [MixpanelProperties.TRANSACTION_TYPE]: properties[PropertyKeys.TX_TYPE],
          [MixpanelProperties.CHAIN_ID]: properties[PropertyKeys.CHAIN_ID],
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
        createProperties: (properties) => ({
          [MixpanelProperties.CHAIN_ID]: properties[PropertyKeys.CHAIN_ID],
          [MixpanelProperties.SAFE_ADDRESS]: properties[PropertyKeys.SAFE_ADDRESS],
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
        createProperties: (properties) => ({
          [MixpanelProperties.CHAIN_ID]: properties[PropertyKeys.CHAIN_ID],
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
