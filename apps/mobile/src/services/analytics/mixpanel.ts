/**
 * MixPanel Analytics Service for Mobile App
 *
 * This service handles MixPanel user attributes tracking for the mobile app.
 * It integrates with the existing Firebase Analytics system and provides
 * cross-platform compatibility with the web app.
 */

import { Mixpanel } from 'mixpanel-react-native'
import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application'
import type { SafeUserAttributes, SafeEventProperties } from '@/src/services/analytics/types'

// MixPanel instance
let mixpanel: Mixpanel | null = null

/**
 * Initialize MixPanel for mobile app
 */
export const initializeMixPanel = async (token: string): Promise<void> => {
  try {
    mixpanel = new Mixpanel(token, true) // true for opt-in tracking
    await mixpanel.init()

    // Set common super properties
    mixpanel.registerSuperProperties({
      platform: 'mobile',
      app_version: `${nativeApplicationVersion}-${nativeBuildVersion}`,
    })

    if (__DEV__) {
      console.info('[MixPanel Mobile] - Initialized successfully')
    }
  } catch (error) {
    console.error('[MixPanel Mobile] - Initialization failed:', error)
  }
}

/**
 * Check if MixPanel is available and initialized
 */
const isMixPanelReady = (): boolean => {
  return mixpanel !== null
}

/**
 * Safely execute MixPanel operations with error handling
 */
const safeMixPanelOperation = (operation: () => void | Promise<void>, operationName: string) => {
  try {
    if (!isMixPanelReady()) {
      if (__DEV__) {
        console.warn(`[MixPanel Mobile] - Not ready for operation: ${operationName}`)
      }
      return
    }

    operation()
  } catch (error) {
    console.error(`[MixPanel Mobile] - ${operationName} failed:`, error)
  }
}

/**
 * Prepare user attributes for MixPanel
 * Converts Date objects to ISO strings for compatibility
 */
const prepareMixPanelUserAttributes = (attributes: SafeUserAttributes): Record<string, unknown> => {
  return {
    ...attributes,
    created_at: attributes.created_at instanceof Date ? attributes.created_at.toISOString() : attributes.created_at,
    last_tx_at: attributes.last_tx_at instanceof Date ? attributes.last_tx_at.toISOString() : attributes.last_tx_at,
  }
}

/**
 * Set user attributes in MixPanel
 */
export const setMixPanelUserAttributes = (attributes: SafeUserAttributes): void => {
  safeMixPanelOperation(() => {
    if (!mixpanel) {
      return
    }

    const mixpanelAttributes = prepareMixPanelUserAttributes(attributes)
    mixpanel.getPeople().set(mixpanelAttributes)

    if (__DEV__) {
      console.info('[MixPanel Mobile] - User attributes set:', mixpanelAttributes)
    }
  }, 'setUserAttributes')
}

/**
 * Set user attributes once (only if not already set)
 */
export const setMixPanelUserAttributesOnce = (attributes: Partial<SafeUserAttributes>): void => {
  safeMixPanelOperation(() => {
    if (!mixpanel) {
      return
    }

    const mixpanelAttributes = prepareMixPanelUserAttributes(attributes as SafeUserAttributes)
    mixpanel.getPeople().setOnce(mixpanelAttributes)

    if (__DEV__) {
      console.info('[MixPanel Mobile] - User attributes set once:', mixpanelAttributes)
    }
  }, 'setUserAttributesOnce')
}

/**
 * Increment numerical user attributes
 */
export const incrementMixPanelUserAttributes = (
  attributes: Partial<Pick<SafeUserAttributes, 'total_tx_count'>>,
): void => {
  safeMixPanelOperation(() => {
    Object.entries(attributes).forEach(([key, value]) => {
      if (typeof value === 'number') {
        if (!mixpanel) {
          return
        }
        mixpanel.getPeople().increment(key, value)
      }
    })

    if (__DEV__) {
      console.info('[MixPanel Mobile] - User attributes incremented:', attributes)
    }
  }, 'incrementUserAttributes')
}

/**
 * Append values to list attributes
 */
export const appendMixPanelUserAttributes = (
  attributes: Partial<Pick<SafeUserAttributes, 'networks' | 'nested_safe_ids'>>,
): void => {
  safeMixPanelOperation(() => {
    Object.entries(attributes).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (!mixpanel) {
          return
        }
        mixpanel.getPeople().append(key, value)
      }
    })

    if (__DEV__) {
      console.info('[MixPanel Mobile] - User attributes appended:', attributes)
    }
  }, 'appendUserAttributes')
}

/**
 * Union operation on list attributes
 */
export const unionMixPanelUserAttributes = (
  attributes: Partial<Pick<SafeUserAttributes, 'networks' | 'nested_safe_ids'>>,
): void => {
  safeMixPanelOperation(() => {
    Object.entries(attributes).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (!mixpanel) {
          return
        }
        mixpanel.getPeople().union(key, value)
      }
    })

    if (__DEV__) {
      console.info('[MixPanel Mobile] - User attributes unioned:', attributes)
    }
  }, 'unionUserAttributes')
}

/**
 * Track an event with Safe-specific properties
 */
export const trackMixPanelEvent = (eventName: string, properties: SafeEventProperties): void => {
  safeMixPanelOperation(() => {
    if (!mixpanel) {
      return
    }

    mixpanel.track(eventName, properties)

    if (__DEV__) {
      console.info(`[MixPanel Mobile] - Event tracked: ${eventName}`, properties)
    }
  }, 'trackEvent')
}

/**
 * Identify user in MixPanel using Safe address
 */
export const identifyMixPanelUser = (safeAddress: string): void => {
  safeMixPanelOperation(() => {
    if (!mixpanel) {
      return
    }

    mixpanel.identify(safeAddress)

    if (__DEV__) {
      console.info('[MixPanel Mobile] - User identified:', safeAddress)
    }
  }, 'identifyUser')
}

/**
 * Register super properties for all events
 */
export const registerMixPanelSuperProperties = (properties: Record<string, unknown>): void => {
  safeMixPanelOperation(() => {
    if (!mixpanel) {
      return
    }

    mixpanel.registerSuperProperties(properties)

    if (__DEV__) {
      console.info('[MixPanel Mobile] - Super properties registered:', properties)
    }
  }, 'registerSuperProperties')
}

/**
 * Reset MixPanel state and clear previous user data
 * Should be called when switching to a new Safe
 * @returns Promise that resolves when reset is complete
 */
export const resetMixPanel = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      safeMixPanelOperation(() => {
        if (!mixpanel) {
          resolve()
          return
        }

        mixpanel.reset()

        if (__DEV__) {
          console.info('[MixPanel Mobile] - Reset - previous user data cleared')
        }

        // Add a small delay to ensure reset is processed
        setTimeout(() => {
          resolve()
        }, 100)
      }, 'reset')
    } catch (error) {
      console.error('[MixPanel Mobile] - Reset failed:', error)
      resolve() // Resolve anyway to not block the flow
    }
  })
}

/**
 * Flush pending MixPanel requests
 */
export const flushMixPanelRequests = (): void => {
  safeMixPanelOperation(() => {
    if (!mixpanel) {
      return
    }

    mixpanel.flush()

    if (__DEV__) {
      console.info('[MixPanel Mobile] - Requests flushed')
    }
  }, 'flushRequests')
}

/**
 * Get MixPanel instance (for advanced usage)
 */
export const getMixPanelInstance = (): Mixpanel | null => {
  return mixpanel
}
