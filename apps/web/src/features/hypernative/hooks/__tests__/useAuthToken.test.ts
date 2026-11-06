import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthToken } from '../useAuthToken'
import * as cookieStorage from '../../store/cookieStorage'

// Mock cookieStorage module
jest.mock('../../store/cookieStorage', () => ({
  getAuthCookieData: jest.fn(),
  setAuthCookie: jest.fn(),
  clearAuthCookie: jest.fn(),
  AUTH_COOKIE_CHANGE_EVENT: jest.requireActual('../../store/cookieStorage').AUTH_COOKIE_CHANGE_EVENT,
}))

const mockGetAuthCookieData = cookieStorage.getAuthCookieData as jest.MockedFunction<
  typeof cookieStorage.getAuthCookieData
>
const mockSetAuthCookie = cookieStorage.setAuthCookie as jest.MockedFunction<typeof cookieStorage.setAuthCookie>
const mockClearAuthCookie = cookieStorage.clearAuthCookie as jest.MockedFunction<typeof cookieStorage.clearAuthCookie>

describe('useAuthToken', () => {
  const originalDateNow = Date.now
  const originalSetInterval = global.setInterval
  const originalClearInterval = global.clearInterval
  const originalAddEventListener = window.addEventListener
  const originalRemoveEventListener = window.removeEventListener

  beforeEach(() => {
    jest.clearAllMocks()
    Date.now = originalDateNow
    mockGetAuthCookieData.mockReturnValue(undefined)

    // Mock window event listeners
    const listeners: Record<string, Array<() => void>> = {}
    window.addEventListener = jest.fn((event: string, listener: () => void) => {
      ;(listeners[event] ||= []).push(listener)
    }) as unknown as typeof window.addEventListener

    window.removeEventListener = jest.fn((event: string, listener: () => void) => {
      listeners[event] = (listeners[event] || []).filter((registered) => registered !== listener)
    }) as unknown as typeof window.removeEventListener

    // Helper to trigger window events
    ;(window as { triggerWindowEvent?: (event: string) => void }).triggerWindowEvent = (event: string) => {
      ;(listeners[event] || []).forEach((listener) => listener())
    }
    ;(window as { triggerStorageEvent?: () => void }).triggerStorageEvent = () => {
      ;(listeners.storage || []).forEach((listener) => listener())
    }
  })

  afterEach(() => {
    Date.now = originalDateNow
    global.setInterval = originalSetInterval
    global.clearInterval = originalClearInterval
    window.addEventListener = originalAddEventListener
    window.removeEventListener = originalRemoveEventListener
    delete (window as { triggerStorageEvent?: () => void }).triggerStorageEvent
    delete (window as { triggerWindowEvent?: (event: string) => void }).triggerWindowEvent
  })

  describe('initial state', () => {
    it('should return unauthenticated state when no token exists', () => {
      mockGetAuthCookieData.mockReturnValue(undefined)

      const { result } = renderHook(() => useAuthToken())

      expect(result.current[0].token).toBeUndefined()
      expect(result.current[0].isAuthenticated).toBe(false)
      expect(result.current[0].isExpired).toBe(false)
    })

    it('should return authenticated state when valid token exists', () => {
      const now = Date.now()
      mockGetAuthCookieData.mockReturnValue({
        token: 'test-token',
        tokenType: 'Bearer',
        expiry: now + 3600000, // 1 hour from now
      })

      const { result } = renderHook(() => useAuthToken())

      expect(result.current[0].token).toBe('Bearer test-token')
      expect(result.current[0].isAuthenticated).toBe(true)
      expect(result.current[0].isExpired).toBe(false)
    })

    it('should hide an expired token that the cookie keeps for a refresh', () => {
      const now = Date.now()
      mockGetAuthCookieData.mockReturnValue({
        token: 'expired-token',
        tokenType: 'Bearer',
        expiry: now - 1000, // 1 second ago
        refreshToken: 'refresh-token',
        refreshExpiry: now + 3600000,
      })

      const { result } = renderHook(() => useAuthToken())

      expect(result.current[0].token).toBeUndefined()
      expect(result.current[0].isAuthenticated).toBe(false)
      expect(result.current[0].isExpired).toBe(true)
    })

    it('should format token with tokenType prefix', () => {
      mockGetAuthCookieData.mockReturnValue({
        token: 'custom-token',
        tokenType: 'Custom',
        expiry: Date.now() + 3600000,
      })

      const { result } = renderHook(() => useAuthToken())

      expect(result.current[0].token).toBe('Custom custom-token')
    })

    it('should handle missing tokenType gracefully by defaulting to Bearer', () => {
      mockGetAuthCookieData.mockReturnValue({
        token: 'token-without-type',
        tokenType: undefined as unknown as string,
        expiry: Date.now() + 3600000,
      })

      const { result } = renderHook(() => useAuthToken())

      // tokenType undefined defaults to "Bearer"
      expect(result.current[0].token).toBe('Bearer token-without-type')
      expect(result.current[0].isAuthenticated).toBe(true)
    })

    it('should handle empty tokenType by defaulting to Bearer', () => {
      mockGetAuthCookieData.mockReturnValue({
        token: 'token-empty-type',
        tokenType: '',
        expiry: Date.now() + 3600000,
      })

      const { result } = renderHook(() => useAuthToken())

      // Empty tokenType defaults to "Bearer"
      expect(result.current[0].token).toBe('Bearer token-empty-type')
      expect(result.current[0].isAuthenticated).toBe(true)
    })

    it('should handle whitespace-only tokenType by defaulting to Bearer', () => {
      mockGetAuthCookieData.mockReturnValue({
        token: 'token-whitespace-type',
        tokenType: '   ',
        expiry: Date.now() + 3600000,
      })

      const { result } = renderHook(() => useAuthToken())

      // Whitespace-only tokenType defaults to "Bearer"
      expect(result.current[0].token).toBe('Bearer token-whitespace-type')
      expect(result.current[0].isAuthenticated).toBe(true)
    })
  })

  describe('setToken', () => {
    it('should store the whole token response, including the refresh token', () => {
      const tokens = {
        access_token: 'new-token',
        token_type: 'Bearer',
        expires_in: 300,
        refresh_token: 'refresh-token',
        refresh_expires_in: 2592000,
      }
      const { result } = renderHook(() => useAuthToken())

      act(() => {
        result.current[1](tokens)
      })

      expect(mockSetAuthCookie).toHaveBeenCalledWith(tokens)
    })

    it('should update state immediately after setting token', () => {
      mockGetAuthCookieData.mockReturnValue(undefined)

      const { result } = renderHook(() => useAuthToken())

      // Initially unauthenticated
      expect(result.current[0].isAuthenticated).toBe(false)

      // Set up mock to return token when checkAuthState is called (which happens in setToken)
      mockGetAuthCookieData.mockReturnValue({
        token: 'immediate-token',
        tokenType: 'Bearer',
        expiry: Date.now() + 3600000,
      })

      act(() => {
        result.current[1]({ access_token: 'immediate-token', token_type: 'Bearer', expires_in: 3600 })
      })

      // State should be updated because setToken calls checkAuthState
      expect(result.current[0].token).toBe('Bearer immediate-token')
      expect(result.current[0].isAuthenticated).toBe(true)
    })
  })

  describe('clearToken', () => {
    it('should clear token and reset state', () => {
      mockGetAuthCookieData.mockReturnValue({
        token: 'existing-token',
        tokenType: 'Bearer',
        expiry: Date.now() + 3600000,
      })

      const { result } = renderHook(() => useAuthToken())

      // Initially authenticated
      expect(result.current[0].isAuthenticated).toBe(true)

      act(() => {
        result.current[2]() // clearToken
      })

      expect(mockClearAuthCookie).toHaveBeenCalled()
      expect(result.current[0].token).toBeUndefined()
      expect(result.current[0].isAuthenticated).toBe(false)
      expect(result.current[0].isExpired).toBe(false)
    })

    it('should clear token even when no token exists', () => {
      mockGetAuthCookieData.mockReturnValue(undefined)

      const { result } = renderHook(() => useAuthToken())

      act(() => {
        result.current[2]() // clearToken
      })

      expect(mockClearAuthCookie).toHaveBeenCalled()
      expect(result.current[0].isAuthenticated).toBe(false)
    })

    it('should maintain consistent state after clearToken when polling triggers', async () => {
      jest.useFakeTimers()

      mockGetAuthCookieData.mockReturnValue({
        token: 'existing-token',
        tokenType: 'Bearer',
        expiry: Date.now() + 3600000,
      })

      const { result } = renderHook(() => useAuthToken())

      // Initially authenticated
      expect(result.current[0].isAuthenticated).toBe(true)

      // Clear token
      act(() => {
        result.current[2]() // clearToken
      })

      // After clearToken, state should be cleared
      expect(result.current[0].isAuthenticated).toBe(false)
      expect(result.current[0].isExpired).toBe(false)

      // Mock that no token exists (cookie was cleared)
      mockGetAuthCookieData.mockReturnValue(undefined)

      // Advance timer to trigger polling (AUTH_POLLING_INTERVAL = 5000ms)
      await act(async () => {
        jest.advanceTimersByTime(5000)
      })

      // State should remain consistent - isExpired should stay false
      // This verifies the fix for the oscillation issue
      expect(result.current[0].isAuthenticated).toBe(false)
      expect(result.current[0].isExpired).toBe(false)

      jest.useRealTimers()
    })
  })

  describe('polling behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should poll auth state periodically', async () => {
      mockGetAuthCookieData.mockReturnValue(undefined)

      const { result } = renderHook(() => useAuthToken())

      // Initially no token
      expect(result.current[0].isAuthenticated).toBe(false)

      // Update mock to return token after some time
      mockGetAuthCookieData.mockReturnValue({
        token: 'polled-token',
        tokenType: 'Bearer',
        expiry: Date.now() + 3600000,
      })

      // Advance timer to trigger polling (AUTH_POLLING_INTERVAL = 5000ms)
      await act(async () => {
        jest.advanceTimersByTime(5000)
      })

      // Should detect token after polling
      await waitFor(() => {
        expect(result.current[0].isAuthenticated).toBe(true)
        expect(result.current[0].token).toBe('Bearer polled-token')
      })
    })

    it('should detect token expiry through polling', async () => {
      const now = Date.now()
      mockGetAuthCookieData.mockReturnValue({
        token: 'expiring-token',
        tokenType: 'Bearer',
        expiry: now + 2000, // Expires in 2 seconds
      })

      const { result } = renderHook(() => useAuthToken())

      // Initially authenticated
      expect(result.current[0].isAuthenticated).toBe(true)
      expect(result.current[0].isExpired).toBe(false)

      // Advance time past expiry
      Date.now = jest.fn(() => now + 3000)

      // Update mock to return expired token
      mockGetAuthCookieData.mockReturnValue({
        token: 'expiring-token',
        tokenType: 'Bearer',
        expiry: now + 2000, // Now expired
      })

      await act(async () => {
        jest.advanceTimersByTime(5000) // Trigger polling
      })

      await waitFor(() => {
        expect(result.current[0].isExpired).toBe(true)
        expect(result.current[0].token).toBeUndefined()
      })
    })

    it('should check auth state on mount', () => {
      mockGetAuthCookieData.mockReturnValue({
        token: 'mount-token',
        tokenType: 'Bearer',
        expiry: Date.now() + 3600000,
      })

      renderHook(() => useAuthToken())

      // Should call getAuthCookieData on mount
      expect(mockGetAuthCookieData).toHaveBeenCalled()
    })
  })

  describe('storage event handling', () => {
    it('should listen to storage events', () => {
      renderHook(() => useAuthToken())

      expect(window.addEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    })

    it('should update state when storage event fires', async () => {
      mockGetAuthCookieData.mockReturnValue(undefined)

      const { result } = renderHook(() => useAuthToken())

      // Initially unauthenticated
      expect(result.current[0].isAuthenticated).toBe(false)

      // Update mock to return token
      mockGetAuthCookieData.mockReturnValue({
        token: 'storage-token',
        tokenType: 'Bearer',
        expiry: Date.now() + 3600000,
      })

      // Trigger storage event
      act(() => {
        const triggerStorageEvent = (window as { triggerStorageEvent?: () => void }).triggerStorageEvent
        if (triggerStorageEvent) {
          triggerStorageEvent()
        }
      })

      await waitFor(() => {
        expect(result.current[0].isAuthenticated).toBe(true)
        expect(result.current[0].token).toBe('Bearer storage-token')
      })
    })

    it('should cleanup storage event listener on unmount', () => {
      const { unmount } = renderHook(() => useAuthToken())

      unmount()

      expect(window.removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    })

    it('should pick up a token written in this tab without waiting for the poll', () => {
      const { result } = renderHook(() => useAuthToken())

      mockGetAuthCookieData.mockReturnValue({
        token: 'refreshed-token',
        tokenType: 'Bearer',
        expiry: Date.now() + 300000,
      })
      act(() => {
        ;(window as unknown as { triggerWindowEvent: (event: string) => void }).triggerWindowEvent(
          cookieStorage.AUTH_COOKIE_CHANGE_EVENT,
        )
      })

      expect(result.current[0].token).toBe('Bearer refreshed-token')
    })
  })

  describe('cleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should cleanup polling interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      const { unmount } = renderHook(() => useAuthToken())

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()

      clearIntervalSpy.mockRestore()
    })

    it('should cleanup storage event listener on unmount', () => {
      const { unmount } = renderHook(() => useAuthToken())

      unmount()

      expect(window.removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    })
  })

  describe('edge cases', () => {
    it('should handle undefined expiry as expired', () => {
      mockGetAuthCookieData.mockReturnValue({
        token: 'token-no-expiry',
        tokenType: 'Bearer',
        expiry: undefined as unknown as number,
      })

      const { result } = renderHook(() => useAuthToken())

      expect(result.current[0].isExpired).toBe(true)
    })

    it('should handle null token', () => {
      mockGetAuthCookieData.mockReturnValue({
        token: null as unknown as string,
        tokenType: 'Bearer',
        expiry: Date.now() + 3600000,
      })

      const { result } = renderHook(() => useAuthToken())

      // null token is falsy, so token ? ... : undefined returns undefined
      expect(result.current[0].token).toBeUndefined()
      expect(result.current[0].isAuthenticated).toBe(false) // !!null is false
    })

    it('should handle empty token string', () => {
      mockGetAuthCookieData.mockReturnValue({
        token: '',
        tokenType: 'Bearer',
        expiry: Date.now() + 3600000,
      })

      const { result } = renderHook(() => useAuthToken())

      // Empty string is falsy, so token ? ... : undefined returns undefined
      expect(result.current[0].token).toBeUndefined()
      expect(result.current[0].isAuthenticated).toBe(false) // !!'' is false
    })

    it('should handle token exactly at expiry time', () => {
      const now = 1000000000
      Date.now = jest.fn(() => now)

      mockGetAuthCookieData.mockReturnValue({
        token: 'expired-now-token',
        tokenType: 'Bearer',
        expiry: now, // Exactly at expiry
      })

      const { result } = renderHook(() => useAuthToken())

      expect(result.current[0].isExpired).toBe(true)
    })
  })

  describe('return value structure', () => {
    it('should return array with three elements', () => {
      const { result } = renderHook(() => useAuthToken())

      expect(Array.isArray(result.current)).toBe(true)
      expect(result.current).toHaveLength(3)
    })

    it('should return authState as first element', () => {
      const { result } = renderHook(() => useAuthToken())

      expect(result.current[0]).toHaveProperty('token')
      expect(result.current[0]).toHaveProperty('isAuthenticated')
      expect(result.current[0]).toHaveProperty('isExpired')
    })

    it('should return setToken function as second element', () => {
      const { result } = renderHook(() => useAuthToken())

      expect(typeof result.current[1]).toBe('function')
    })

    it('should return clearToken function as third element', () => {
      const { result } = renderHook(() => useAuthToken())

      expect(typeof result.current[2]).toBe('function')
      expect(result.current[2].length).toBe(0) // Function expects 0 parameters
    })
  })
})
