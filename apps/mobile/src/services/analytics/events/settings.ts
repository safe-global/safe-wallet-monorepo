import { EventType } from '../types'

const SETTINGS_CATEGORY = 'settings'

export const SETTINGS_EVENTS = {
  APPEARANCE: {
    THEME_CHANGE: {
      eventName: EventType.META,
      eventCategory: SETTINGS_CATEGORY,
      eventAction: 'Theme preference changed',
      // eventLabel will be the theme value: 'light', 'dark', or 'auto'
    },
  },
  NOTIFICATIONS: {
    TOGGLE: {
      eventName: EventType.META,
      eventCategory: SETTINGS_CATEGORY,
      eventAction: 'Notifications toggled',
      // eventLabel will be boolean: true/false
    },
  },
  BIOMETRICS: {
    TOGGLE: {
      eventName: EventType.META,
      eventCategory: SETTINGS_CATEGORY,
      eventAction: 'Biometrics toggled',
      // eventLabel will be boolean: true/false
    },
  },
}

/**
 * Helper function to create theme change event
 * @param themePreference - The new theme preference: 'light' | 'dark' | 'auto'
 */
export const createThemeChangeEvent = (themePreference: string) => ({
  ...SETTINGS_EVENTS.APPEARANCE.THEME_CHANGE,
  eventLabel: themePreference,
})

/**
 * Helper function to create notification toggle event
 * @param enabled - Whether notifications are enabled
 */
export const createNotificationToggleEvent = (enabled: boolean) => ({
  ...SETTINGS_EVENTS.NOTIFICATIONS.TOGGLE,
  eventLabel: enabled,
})

/**
 * Helper function to create biometrics toggle event
 * @param enabled - Whether biometrics are enabled
 */
export const createBiometricsToggleEvent = (enabled: boolean) => ({
  ...SETTINGS_EVENTS.BIOMETRICS.TOGGLE,
  eventLabel: enabled,
})

/**
 * Track when user opens app settings from the settings menu
 */
export const createAppSettingsOpenEvent = () => ({
  eventName: EventType.META,
  eventCategory: SETTINGS_CATEGORY,
  eventAction: 'Safe settings opened',
  eventLabel: 'Settings menu button pressed',
})

/**
 * Track when user selects an action from the settings menu
 */
export const createSettingsMenuActionEvent = (action: 'rename' | 'explorer' | 'share' | 'remove') => ({
  eventName: EventType.META,
  eventCategory: SETTINGS_CATEGORY,
  eventAction: 'Settings menu action',
  eventLabel: action,
})
