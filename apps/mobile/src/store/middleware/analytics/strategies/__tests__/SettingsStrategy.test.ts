import { SettingsStrategy } from '../SettingsStrategy'
import { trackEvent } from '@/src/services/analytics'
import {
  createThemeChangeEvent,
  createNotificationToggleEvent,
  createBiometricsToggleEvent,
} from '@/src/services/analytics/events/settings'
import { EventType } from '@/src/services/analytics/types'
import type { RootState } from '@/src/store'
import type { ActionWithPayload } from '@/src/store/utils/strategy/Strategy'
import { MiddlewareAPI, Dispatch } from '@reduxjs/toolkit'

// Mock the dependencies
jest.mock('@/src/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/src/services/analytics/events/settings', () => ({
  createThemeChangeEvent: jest.fn(),
  createNotificationToggleEvent: jest.fn(),
  createBiometricsToggleEvent: jest.fn(),
}))

const mockTrackEvent = jest.mocked(trackEvent)
const mockCreateThemeChangeEvent = jest.mocked(createThemeChangeEvent)
const mockCreateNotificationToggleEvent = jest.mocked(createNotificationToggleEvent)
const mockCreateBiometricsToggleEvent = jest.mocked(createBiometricsToggleEvent)

describe('SettingsStrategy', () => {
  let strategy: SettingsStrategy
  let mockStore: MiddlewareAPI<Dispatch, RootState>

  beforeEach(() => {
    strategy = new SettingsStrategy()
    mockStore = {
      dispatch: jest.fn(),
      getState: jest.fn(),
    }

    jest.clearAllMocks()
  })

  describe('theme change tracking', () => {
    it('should track theme change event when themePreference is updated', () => {
      const action: ActionWithPayload = {
        type: 'settings/updateSettings',
        payload: {
          themePreference: 'dark',
        },
      }

      const mockEventData = {
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Theme preference changed',
        eventLabel: 'dark',
      }

      mockCreateThemeChangeEvent.mockReturnValue(mockEventData)
      mockTrackEvent.mockResolvedValue(undefined)

      strategy.execute(mockStore, action)

      expect(mockCreateThemeChangeEvent).toHaveBeenCalledWith('dark')
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEventData)
    })

    it('should track all theme preferences', () => {
      const themes = ['light', 'dark', 'auto']

      themes.forEach((theme) => {
        const action: ActionWithPayload = {
          type: 'settings/updateSettings',
          payload: {
            themePreference: theme,
          },
        }

        const mockEventData = {
          eventName: EventType.META,
          eventCategory: 'settings',
          eventAction: 'Theme preference changed',
          eventLabel: theme,
        }

        mockCreateThemeChangeEvent.mockReturnValue(mockEventData)

        strategy.execute(mockStore, action)

        expect(mockCreateThemeChangeEvent).toHaveBeenCalledWith(theme)
        expect(mockTrackEvent).toHaveBeenCalledWith(mockEventData)
      })
    })
  })

  describe('notification tracking', () => {
    it('should track notification enable event', () => {
      const action: ActionWithPayload = {
        type: 'settings/updateSettings',
        payload: {
          notificationsEnabled: true,
        },
      }

      const mockEventData = {
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Notifications toggled',
        eventLabel: true,
      }

      mockCreateNotificationToggleEvent.mockReturnValue(mockEventData)

      strategy.execute(mockStore, action)

      expect(mockCreateNotificationToggleEvent).toHaveBeenCalledWith(true)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEventData)
    })

    it('should track notification disable event', () => {
      const action: ActionWithPayload = {
        type: 'settings/updateSettings',
        payload: {
          notificationsEnabled: false,
        },
      }

      const mockEventData = {
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Notifications toggled',
        eventLabel: false,
      }

      mockCreateNotificationToggleEvent.mockReturnValue(mockEventData)

      strategy.execute(mockStore, action)

      expect(mockCreateNotificationToggleEvent).toHaveBeenCalledWith(false)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEventData)
    })
  })

  describe('biometrics tracking', () => {
    it('should track biometrics enable event', () => {
      const action: ActionWithPayload = {
        type: 'settings/updateSettings',
        payload: {
          biometricsEnabled: true,
        },
      }

      const mockEventData = {
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Biometrics toggled',
        eventLabel: true,
      }

      mockCreateBiometricsToggleEvent.mockReturnValue(mockEventData)

      strategy.execute(mockStore, action)

      expect(mockCreateBiometricsToggleEvent).toHaveBeenCalledWith(true)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEventData)
    })

    it('should track biometrics disable event', () => {
      const action: ActionWithPayload = {
        type: 'settings/updateSettings',
        payload: {
          biometricsEnabled: false,
        },
      }

      const mockEventData = {
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Biometrics toggled',
        eventLabel: false,
      }

      mockCreateBiometricsToggleEvent.mockReturnValue(mockEventData)

      strategy.execute(mockStore, action)

      expect(mockCreateBiometricsToggleEvent).toHaveBeenCalledWith(false)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEventData)
    })
  })

  describe('multiple settings tracking', () => {
    it('should track multiple settings changes in one action', () => {
      const action: ActionWithPayload = {
        type: 'settings/updateSettings',
        payload: {
          themePreference: 'dark',
          notificationsEnabled: true,
          biometricsEnabled: false,
        },
      }

      const mockThemeEvent = {
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Theme preference changed',
        eventLabel: 'dark',
      }

      const mockNotificationEvent = {
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Notifications toggled',
        eventLabel: true,
      }

      const mockBiometricsEvent = {
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Biometrics toggled',
        eventLabel: false,
      }

      mockCreateThemeChangeEvent.mockReturnValue(mockThemeEvent)
      mockCreateNotificationToggleEvent.mockReturnValue(mockNotificationEvent)
      mockCreateBiometricsToggleEvent.mockReturnValue(mockBiometricsEvent)

      strategy.execute(mockStore, action)

      expect(mockCreateThemeChangeEvent).toHaveBeenCalledWith('dark')
      expect(mockCreateNotificationToggleEvent).toHaveBeenCalledWith(true)
      expect(mockCreateBiometricsToggleEvent).toHaveBeenCalledWith(false)
      expect(mockTrackEvent).toHaveBeenCalledTimes(3)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockThemeEvent)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockNotificationEvent)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockBiometricsEvent)
    })

    it('should handle settings update with non-tracked properties without tracking', () => {
      const action: ActionWithPayload = {
        type: 'settings/updateSettings',
        payload: {
          onboardingVersionSeen: '1.0.0',
          someOtherSetting: 'value',
        },
      }

      strategy.execute(mockStore, action)

      expect(mockCreateThemeChangeEvent).not.toHaveBeenCalled()
      expect(mockCreateNotificationToggleEvent).not.toHaveBeenCalled()
      expect(mockCreateBiometricsToggleEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should handle mixed tracked and non-tracked settings', () => {
      const action: ActionWithPayload = {
        type: 'settings/updateSettings',
        payload: {
          themePreference: 'light',
          onboardingVersionSeen: '1.0.0',
          notificationsEnabled: true,
          someOtherSetting: 'value',
        },
      }

      const mockThemeEvent = {
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Theme preference changed',
        eventLabel: 'light',
      }

      const mockNotificationEvent = {
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Notifications toggled',
        eventLabel: true,
      }

      mockCreateThemeChangeEvent.mockReturnValue(mockThemeEvent)
      mockCreateNotificationToggleEvent.mockReturnValue(mockNotificationEvent)

      strategy.execute(mockStore, action)

      expect(mockCreateThemeChangeEvent).toHaveBeenCalledWith('light')
      expect(mockCreateNotificationToggleEvent).toHaveBeenCalledWith(true)
      expect(mockCreateBiometricsToggleEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).toHaveBeenCalledTimes(2)
    })
  })

  describe('edge cases', () => {
    it('should not track event for non-settings actions', () => {
      const action: ActionWithPayload = {
        type: 'some/other/action',
        payload: {
          themePreference: 'dark',
        },
      }

      strategy.execute(mockStore, action)

      expect(mockCreateThemeChangeEvent).not.toHaveBeenCalled()
      expect(mockCreateNotificationToggleEvent).not.toHaveBeenCalled()
      expect(mockCreateBiometricsToggleEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should not track event when payload is null', () => {
      const action: ActionWithPayload = {
        type: 'settings/updateSettings',
        payload: null,
      }

      strategy.execute(mockStore, action)

      expect(mockCreateThemeChangeEvent).not.toHaveBeenCalled()
      expect(mockCreateNotificationToggleEvent).not.toHaveBeenCalled()
      expect(mockCreateBiometricsToggleEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should not track event when payload is not an object', () => {
      const action: ActionWithPayload = {
        type: 'settings/updateSettings',
        payload: 'invalid payload',
      }

      strategy.execute(mockStore, action)

      expect(mockCreateThemeChangeEvent).not.toHaveBeenCalled()
      expect(mockCreateNotificationToggleEvent).not.toHaveBeenCalled()
      expect(mockCreateBiometricsToggleEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should handle trackEvent errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      const action: ActionWithPayload = {
        type: 'settings/updateSettings',
        payload: {
          themePreference: 'dark',
          notificationsEnabled: true,
          biometricsEnabled: false,
        },
      }

      mockCreateThemeChangeEvent.mockReturnValue({
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Theme preference changed',
        eventLabel: 'dark',
      })

      mockCreateNotificationToggleEvent.mockReturnValue({
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Notifications toggled',
        eventLabel: true,
      })

      mockCreateBiometricsToggleEvent.mockReturnValue({
        eventName: EventType.META,
        eventCategory: 'settings',
        eventAction: 'Biometrics toggled',
        eventLabel: false,
      })

      mockTrackEvent.mockRejectedValue(new Error('Analytics service unavailable'))

      // Should not throw even if trackEvent fails
      expect(() => {
        strategy.execute(mockStore, action)
      }).not.toThrow()

      expect(mockTrackEvent).toHaveBeenCalledTimes(3)

      consoleErrorSpy.mockRestore()
    })
  })
})
