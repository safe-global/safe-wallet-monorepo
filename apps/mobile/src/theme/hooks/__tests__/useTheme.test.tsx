import { renderHook, act } from '@testing-library/react-native'
import { useTheme } from '../useTheme'
import React from 'react'

// Mock React Native dependencies
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
  useColorScheme: jest.fn(),
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
}))

// Mock the Redux hooks
jest.mock('@/src/store/hooks', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}))

// Mock the store actions
jest.mock('@/src/store/settingsSlice', () => ({
  updateSettings: jest.fn((payload) => ({ type: 'settings/updateSettings', payload })),
  selectSettings: jest.fn(),
}))

const mockUseColorScheme = jest.requireMock('react-native').useColorScheme
const mockAppStateAddEventListener = jest.requireMock('react-native').AppState.addEventListener
const mockUseAppDispatch = jest.requireMock('@/src/store/hooks').useAppDispatch
const mockUseAppSelector = jest.requireMock('@/src/store/hooks').useAppSelector
const mockUpdateSettings = jest.requireMock('@/src/store/settingsSlice').updateSettings

describe('useTheme', () => {
  const mockDispatch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset default mocks
    mockUseColorScheme.mockReturnValue('light')
    mockAppStateAddEventListener.mockReturnValue({
      remove: jest.fn(),
    })
    mockUseAppDispatch.mockReturnValue(mockDispatch)
    mockUseAppSelector.mockReturnValue('auto') // Default theme preference
  })

  describe('colorScheme resolution', () => {
    it.each([
      {
        osColorScheme: 'light',
        expectedColorScheme: 'light',
        expectedIsDark: false,
      },
      {
        osColorScheme: 'dark',
        expectedColorScheme: 'dark',
        expectedIsDark: true,
      },
    ])(
      'should return OS color scheme when themePreference is auto and OS has $osColorScheme scheme',
      ({ osColorScheme, expectedColorScheme, expectedIsDark }) => {
        mockUseColorScheme.mockReturnValue(osColorScheme)
        mockUseAppSelector.mockReturnValue('auto')

        const { result } = renderHook(() => useTheme())

        expect(result.current.colorScheme).toBe(expectedColorScheme)
        expect(result.current.isDark).toBe(expectedIsDark)
        expect(result.current.themePreference).toBe('auto')
      },
    )

    it('should return undefined when OS color scheme is null and themePreference is auto', () => {
      mockUseColorScheme.mockReturnValue(null)
      mockUseAppSelector.mockReturnValue('auto')

      const { result } = renderHook(() => useTheme())

      expect(result.current.colorScheme).toBe(undefined)
      expect(result.current.isDark).toBe(false)
      expect(result.current.themePreference).toBe('auto')
    })

    it.each([
      {
        themePreference: 'light',
        osColorScheme: 'dark',
        expectedColorScheme: 'light',
        expectedIsDark: false,
      },
      {
        themePreference: 'dark',
        osColorScheme: 'light',
        expectedColorScheme: 'dark',
        expectedIsDark: true,
      },
    ])(
      'should return manual theme preference when $themePreference preference overrides $osColorScheme OS',
      ({ themePreference, osColorScheme, expectedColorScheme, expectedIsDark }) => {
        mockUseColorScheme.mockReturnValue(osColorScheme)
        mockUseAppSelector.mockReturnValue(themePreference)

        const { result } = renderHook(() => useTheme())

        expect(result.current.colorScheme).toBe(expectedColorScheme)
        expect(result.current.isDark).toBe(expectedIsDark)
        expect(result.current.themePreference).toBe(themePreference)
      },
    )

    it('should default to auto when themePreference is not set', () => {
      mockUseColorScheme.mockReturnValue('light')
      // Mock useAppSelector to simulate the ?? 'auto' logic in the hook
      mockUseAppSelector.mockReturnValue('auto')

      const { result } = renderHook(() => useTheme())

      expect(result.current.themePreference).toBe('auto')
      expect(result.current.colorScheme).toBe('light')
    })
  })

  describe('setThemePreference', () => {
    it.each(['dark', 'light', 'auto'] as const)(
      'should dispatch updateSettings when setThemePreference is called with %s',
      (themeValue) => {
        const { result } = renderHook(() => useTheme())

        act(() => {
          result.current.setThemePreference(themeValue)
        })

        expect(mockUpdateSettings).toHaveBeenCalledWith({ themePreference: themeValue })
      },
    )
  })

  describe('AppState change handling', () => {
    it('should register AppState listener on mount', () => {
      renderHook(() => useTheme())

      expect(mockAppStateAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should dispatch updateSettings when app becomes active', () => {
      let appStateChangeHandler: (nextAppState: string) => void

      mockAppStateAddEventListener.mockImplementation((event: any, handler: any) => {
        if (event === 'change') {
          appStateChangeHandler = handler
        }
        return { remove: jest.fn() }
      })

      mockUseAppSelector.mockReturnValue('dark')

      renderHook(() => useTheme())

      // Clear the initial dispatch calls
      mockDispatch.mockClear()

      // Simulate app state change to active
      act(() => {
        appStateChangeHandler!('active')
      })

      expect(mockDispatch).toHaveBeenCalledWith(mockUpdateSettings({ themePreference: 'dark' }))
    })

    it.each(['background', 'inactive'])('should not dispatch updateSettings when app goes to %s', (appState) => {
      let appStateChangeHandler: (nextAppState: string) => void

      mockAppStateAddEventListener.mockImplementation((event: any, handler: any) => {
        if (event === 'change') {
          appStateChangeHandler = handler
        }
        return { remove: jest.fn() }
      })

      renderHook(() => useTheme())

      // Clear the initial calls
      mockUpdateSettings.mockClear()

      // Simulate app state change
      act(() => {
        appStateChangeHandler!(appState)
      })

      expect(mockUpdateSettings).not.toHaveBeenCalled()
    })

    it('should remove AppState listener on unmount', () => {
      const mockRemove = jest.fn()
      mockAppStateAddEventListener.mockReturnValue({
        remove: mockRemove,
      })

      const { unmount } = renderHook(() => useTheme())

      unmount()

      expect(mockRemove).toHaveBeenCalled()
    })
  })
})
