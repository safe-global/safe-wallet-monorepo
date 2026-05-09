import { RootState } from '@/src/store'
import { MiddlewareAPI, Dispatch } from 'redux'
import { Strategy, ActionWithPayload } from '@/src/store/utils/strategy/Strategy'
import { trackEvent } from '@/src/services/analytics'
import {
  createThemeChangeEvent,
  createNotificationToggleEvent,
  createBiometricsToggleEvent,
} from '@/src/services/analytics/events/settings'
import { ThemePreference } from '@/src/types/theme'

export class SettingsStrategy implements Strategy<RootState, MiddlewareAPI<Dispatch, RootState>> {
  execute(_store: MiddlewareAPI<Dispatch, RootState>, action: ActionWithPayload): void {
    // Check if this is a settings update action
    if (action.type === 'settings/updateSettings' && action.payload && typeof action.payload === 'object') {
      this.trackSettingsChanges(action.payload as Record<string, unknown>)
    }
  }

  private trackSettingsChanges(payload: Record<string, unknown>): void {
    // Track theme preference changes
    if ('themePreference' in payload && payload.themePreference) {
      const themePreference = payload.themePreference as ThemePreference
      trackEvent(createThemeChangeEvent(themePreference)).catch((error) => {
        console.error('[SettingsStrategy] Error tracking theme change event:', error)
      })
    }

    // Track notification settings changes
    if ('notificationsEnabled' in payload && typeof payload.notificationsEnabled === 'boolean') {
      trackEvent(createNotificationToggleEvent(payload.notificationsEnabled)).catch((error) => {
        console.error('[SettingsStrategy] Error tracking notification toggle event:', error)
      })
    }

    // Track biometrics settings changes
    if ('biometricsEnabled' in payload && typeof payload.biometricsEnabled === 'boolean') {
      trackEvent(createBiometricsToggleEvent(payload.biometricsEnabled)).catch((error) => {
        console.error('[SettingsStrategy] Error tracking biometrics toggle event:', error)
      })
    }
  }
}
