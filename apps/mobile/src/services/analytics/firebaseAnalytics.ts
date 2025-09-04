/**
 * Firebase Analytics Service
 *
 * This service handles all analytics events for the mobile app using Firebase Analytics.
 * It automatically includes common parameters with every event and manages user properties.
 *
 */

import { getAnalytics } from '@react-native-firebase/analytics'
import type { AnalyticsEvent } from './types'
import { AnalyticsUserProperties } from './types'
import { nativeApplicationVersion, nativeBuildVersion } from 'expo-application'

// Common parameters that are sent with every event
const commonEventParams = {
  appVersion: `${nativeApplicationVersion}-${nativeBuildVersion}`,
  chainId: '',
  safeAddress: '',
}

/**
 * Set the chain ID for all subsequent events
 */
export const setChainId = (chainId: string): void => {
  commonEventParams.chainId = chainId
}

/**
 * Set the safe address for all subsequent events
 */
export const setSafeAddress = (safeAddress: string): void => {
  // Remove 0x prefix to match web app behavior
  commonEventParams.safeAddress = safeAddress.startsWith('0x') ? safeAddress.slice(2) : safeAddress
}

/**
 * Set user properties for Firebase Analytics
 */
export const setUserProperty = async (name: AnalyticsUserProperties, value: string): Promise<void> => {
  try {
    await getAnalytics().setUserProperty(name, value)

    if (__DEV__) {
      console.info('[Firebase Analytics] - Set user property:', name, '=', value)
    }
  } catch (error) {
    console.error('[Firebase Analytics] - Error setting user property:', error)
  }
}

/**
 * Set user ID for Firebase Analytics
 */
export const setUserId = async (userId: string): Promise<void> => {
  try {
    await getAnalytics().setUserId(userId)

    if (__DEV__) {
      console.info('[Firebase Analytics] - Set user ID:', userId)
    }
  } catch (error) {
    console.error('[Firebase Analytics] - Error setting user ID:', error)
  }
}

/**
 * Track a custom event with common parameters
 */
export const trackEvent = async (eventData: AnalyticsEvent): Promise<void> => {
  try {
    const analytics = getAnalytics()

    // Prepare event parameters
    const eventParams: Record<string, string | number | boolean> = {
      ...commonEventParams,
      eventCategory: truncateParam(eventData.eventCategory) ?? '',
      eventAction: truncateParam(eventData.eventAction) ?? '',
      chainId: eventData.chainId || commonEventParams.chainId,
    }

    // Add event label if provided
    if (eventData.eventLabel !== undefined) {
      eventParams.eventLabel = truncateParam(String(eventData.eventLabel)) ?? ''
    }

    // Log the event
    await analytics.logEvent(eventData.eventName, eventParams)

    if (__DEV__) {
      console.info('[Firebase Analytics] - Event tracked:', {
        eventName: eventData.eventName,
        ...eventParams,
      })
    }
  } catch (error) {
    console.error('[Firebase Analytics] - Error tracking event:', error)
  }
}

// Helper to truncate parameter values to 100 characters
function truncateParam(value: string | undefined): string | undefined {
  if (typeof value === 'string' && value.length > 100) {
    return value.slice(0, 100)
  }
  return value
}

/**
 * Track screen views
 */
export const trackScreenView = async (screenName: string, screenClass?: string): Promise<void> => {
  try {
    const analytics = getAnalytics()

    await analytics.logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
      ...commonEventParams,
    })

    if (__DEV__) {
      console.info('[Firebase Analytics] - Screen view tracked:', screenName)
    }
  } catch (error) {
    console.error('[Firebase Analytics] - Error tracking screen view:', error)
  }
}

/**
 * Enable/disable analytics collection
 */
export const setAnalyticsCollectionEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await getAnalytics().setAnalyticsCollectionEnabled(enabled)

    if (__DEV__) {
      console.info('[Firebase Analytics] - Analytics collection enabled:', enabled)
    }
  } catch (error) {
    console.error('[Firebase Analytics] - Error setting analytics collection:', error)
  }
}
