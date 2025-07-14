import mixpanel from 'mixpanel-browser'
import { IS_PRODUCTION } from '@/config/constants'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SafeUserAttributes, MixPanelUserProfileUpdate, SafeEventProperties } from './types'
import { prepareMixPanelUserAttributes } from './user-attributes'

/**
 * Checks if MixPanel is available and properly initialized
 * @returns boolean indicating if MixPanel is ready
 */
const isMixPanelReady = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!mixpanel
}

/**
 * Safely executes MixPanel operations with error handling
 * @param operation Function to execute
 * @param operationName Name of the operation for logging
 */
const safeMixPanelOperation = (operation: () => void, operationName: string) => {
  if (!isMixPanelReady()) {
    if (!IS_PRODUCTION) {
      console.warn(`MixPanel not ready for operation: ${operationName}`)
    }
    return
  }

  try {
    // Check if user has opted in to tracking
    // Deactivated for testing
    // if (!mixpanel.has_opted_in_tracking()) {
    //   if (!IS_PRODUCTION) {
    //     console.warn(`MixPanel tracking not opted in for operation: ${operationName}`)
    //   }
    //   return
    // }

    operation()
  } catch (error) {
    console.error(`MixPanel ${operationName} failed:`, error)
  }
}

/**
 * Sets user attributes in MixPanel using $set (updates every time)
 * @param attributes SafeUserAttributes to set
 */
export const setMixPanelUserAttributes = (attributes: SafeUserAttributes) => {
  safeMixPanelOperation(() => {
    const mixpanelAttributes = prepareMixPanelUserAttributes(attributes)

    mixpanel.people.set(mixpanelAttributes)

    if (!IS_PRODUCTION) {
      console.log('MixPanel user attributes set:', mixpanelAttributes)
    }
  }, 'setUserAttributes')
}

/**
 * Sets user attributes in MixPanel using $set_once (only sets if not already set)
 * Useful for attributes that should never change like creation date
 * @param attributes Partial SafeUserAttributes to set once
 */
export const setMixPanelUserAttributesOnce = (attributes: Partial<SafeUserAttributes>) => {
  safeMixPanelOperation(() => {
    const mixpanelAttributes = prepareMixPanelUserAttributes(attributes as SafeUserAttributes)

    mixpanel.people.set_once(mixpanelAttributes)

    if (!IS_PRODUCTION) {
      console.log('MixPanel user attributes set once:', mixpanelAttributes)
    }
  }, 'setUserAttributesOnce')
}

/**
 * Increments numerical user attributes in MixPanel
 * @param attributes Attributes to increment (e.g., total_tx_count)
 */
export const incrementMixPanelUserAttributes = (attributes: Partial<Pick<SafeUserAttributes, 'total_tx_count'>>) => {
  safeMixPanelOperation(() => {
    Object.entries(attributes).forEach(([key, value]) => {
      if (typeof value === 'number') {
        const humanizedKey = key === 'total_tx_count' ? 'Total Transaction Count' : key
        mixpanel.people.increment(humanizedKey, value)
      }
    })

    if (!IS_PRODUCTION) {
      console.log('MixPanel user attributes incremented:', attributes)
    }
  }, 'incrementUserAttributes')
}

/**
 * Appends values to list attributes in MixPanel
 * @param attributes Attributes to append to (e.g., networks, nested_safe_ids)
 */
export const appendMixPanelUserAttributes = (
  attributes: Partial<Pick<SafeUserAttributes, 'networks' | 'nested_safe_ids'>>,
) => {
  safeMixPanelOperation(() => {
    Object.entries(attributes).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const humanizedKey = key === 'networks' ? 'Networks' : key === 'nested_safe_ids' ? 'Nested Safe IDs' : key
        mixpanel.people.append(humanizedKey, value)
      }
    })

    if (!IS_PRODUCTION) {
      console.log('MixPanel user attributes appended:', attributes)
    }
  }, 'appendUserAttributes')
}

/**
 * Performs union operation on list attributes in MixPanel
 * Adds values to list only if they don't already exist
 * @param attributes Attributes to union (e.g., networks, nested_safe_ids)
 */
export const unionMixPanelUserAttributes = (
  attributes: Partial<Pick<SafeUserAttributes, 'networks' | 'nested_safe_ids'>>,
) => {
  safeMixPanelOperation(() => {
    Object.entries(attributes).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const humanizedKey = key === 'networks' ? 'Networks' : key === 'nested_safe_ids' ? 'Nested Safe IDs' : key
        mixpanel.people.union(humanizedKey, value)
      }
    })

    if (!IS_PRODUCTION) {
      console.log('MixPanel user attributes unioned:', attributes)
    }
  }, 'unionUserAttributes')
}

/**
 * Batch updates user attributes using MixPanel's bulk update methods
 * @param updates MixPanelUserProfileUpdate object with different update types
 */
export const batchUpdateMixPanelUserAttributes = (updates: MixPanelUserProfileUpdate) => {
  safeMixPanelOperation(() => {
    if (updates.$set) {
      const mixpanelAttributes = prepareMixPanelUserAttributes(updates.$set as SafeUserAttributes)
      mixpanel.people.set(mixpanelAttributes)
    }

    if (updates.$set_once) {
      const mixpanelAttributes = prepareMixPanelUserAttributes(updates.$set_once as SafeUserAttributes)
      mixpanel.people.set_once(mixpanelAttributes)
    }

    if (updates.$add) {
      Object.entries(updates.$add).forEach(([key, value]) => {
        if (typeof value === 'number') {
          const humanizedKey = key === 'total_tx_count' ? 'Total Transaction Count' : key
          mixpanel.people.increment(humanizedKey, value)
        }
      })
    }

    if (updates.$append) {
      Object.entries(updates.$append).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          const humanizedKey = key === 'networks' ? 'Networks' : key === 'nested_safe_ids' ? 'Nested Safe IDs' : key
          mixpanel.people.append(humanizedKey, value)
        }
      })
    }

    if (updates.$union) {
      Object.entries(updates.$union).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          const humanizedKey = key === 'networks' ? 'Networks' : key === 'nested_safe_ids' ? 'Nested Safe IDs' : key
          mixpanel.people.union(humanizedKey, value)
        }
      })
    }

    if (!IS_PRODUCTION) {
      console.log('MixPanel batch user attributes updated:', updates)
    }
  }, 'batchUpdateUserAttributes')
}

/**
 * Tracks an event with Safe-specific properties
 * @param eventName Name of the event
 * @param properties Event properties including Safe context
 */
export const trackMixPanelEvent = (eventName: string, properties: SafeEventProperties) => {
  safeMixPanelOperation(() => {
    mixpanel.track(eventName, properties)

    if (!IS_PRODUCTION) {
      console.log(`MixPanel event tracked: ${eventName}`, properties)
    }
  }, 'trackEvent')
}

/**
 * Identifies the user in MixPanel using Safe address as distinct_id
 * This is crucial for cohort analysis
 * @param safeAddress Safe address to use as user identifier
 */
export const identifyMixPanelUser = (safeAddress: string) => {
  safeMixPanelOperation(() => {
    mixpanel.identify(safeAddress)

    if (!IS_PRODUCTION) {
      console.log('MixPanel user identified:', safeAddress)
    }
  }, 'identifyUser')
}

/**
 * Registers super properties that will be sent with every event
 * @param properties Properties to register as super properties
 */
export const registerMixPanelSuperProperties = (properties: Record<string, any>) => {
  safeMixPanelOperation(() => {
    mixpanel.register(properties)

    if (!IS_PRODUCTION) {
      console.log('MixPanel super properties registered:', properties)
    }
  }, 'registerSuperProperties')
}

/**
 * Hook to check if MixPanel tracking is enabled
 * @returns boolean indicating if MixPanel is enabled
 */
export const useMixPanelEnabled = (): boolean => {
  const isMixpanelFeatureEnabled = useHasFeature(FEATURES.MIXPANEL)

  // Only check if MixPanel is ready if the feature is enabled
  if (!isMixpanelFeatureEnabled) return false

  // Check if we have the MixPanel token
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  if (!token) return false

  return isMixPanelReady()
}

/**
 * Resets MixPanel state and clears previous user data
 * Should be called when switching to a new Safe
 * @returns Promise that resolves when reset is complete
 */
export const resetMixPanel = (): Promise<void> => {
  return new Promise((resolve) => {
    try {
      safeMixPanelOperation(() => {
        if (mixpanel.reset) {
          mixpanel.reset()
        }

        if (!IS_PRODUCTION) {
          console.log('MixPanel reset - previous user data cleared')
        }

        // Add a small delay to ensure reset is processed
        setTimeout(() => {
          resolve()
        }, 100)
      }, 'reset')
    } catch (error) {
      console.error('MixPanel reset failed:', error)
      resolve() // Resolve anyway to not block the flow
    }
  })
}

/**
 * Flushes any pending MixPanel requests
 * Useful before page navigation or app close
 */
export const flushMixPanelRequests = () => {
  safeMixPanelOperation(() => {
    if (typeof (mixpanel as any).flush === 'function') {
      ;(mixpanel as any).flush()
    }

    if (!IS_PRODUCTION) {
      console.log('MixPanel requests flushed')
    }
  }, 'flushRequests')
}
