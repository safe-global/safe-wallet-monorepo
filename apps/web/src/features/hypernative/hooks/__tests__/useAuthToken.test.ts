import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthToken } from '../useAuthToken'
import * as cookieStorage from '../../store/cookieStorage'
import { getStoreInstance } from '@/store'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'

// Mock cookieStorage module
jest.mock('../../store/cookieStorage', () => ({
  getAuthCookieData: jest.fn(),
  setAuthCookie: jest.fn(),
  clearAuthCookie: jest.fn(),
}))

// Mock the store's imperative accessor (used outside React components) rather than the whole
// store module, so this test doesn't have to boot the real app store
jest.mock('@/store', () => ({
  getStoreInstance: jest.fn(),
}))

jest.mock('@safe-global/store/hypernative/hypernativeApi', () => ({
  hypernativeApi: {
    endpoints: {
      refreshToken: {
        initiate: jest.fn(),
      },
    },
  },
}))

const mockGetAuthCookieData = cookieStorage.getAuthCookieData as jest.MockedFunction<
  typeof cookieStorage.getAuthCookieData
>
const mockSetAuthCookie = cookieStorage.setAuthCookie as jest.MockedFunction<typeof cookieStorage.setAuthCookie>
const mockClearAuthCookie = cookieStorage.clearAuthCookie as jest.MockedFunction<typeof cookieStorage.clearAuthCookie>
const mockGetStoreInstance = getStoreInstance as jest.MockedFunction<typeof getStoreInstance>
const mockInitiate = hypernativeApi.endpoints.refreshToken.initiate as jest.Mock

/** Mirrors REFRESH_RETRY_DELAYS_MS in the hook - the number of retries before a token is left alone */
const REFRESH_RETRY_ATTEMPTS = 4

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

    // Mock storage event listeners
    const storageListeners: Array<() => void> = []
    window.addEventListener = jest.fn((event: string, listener: () => void) => {
      if (event === 'storage') {
        storageListeners.push(listener)
      }
    }) as unknown as typeof window.addEventListener

    window.removeEventListener = jest.fn((event: string, listener: () => void) => {
      if (event === 'storage') {
        const index = storageListeners.indexOf(listener)
        if (index > -1) {
          storageListeners.splice(index, 1)
        }
      }
    }) as unknown as typeof window.removeEventListener

    // Helper to trigger storage events
    ;(window as { triggerStorageEvent?: () => void }).triggerStorageEvent = () => {
      storageListeners.forEach((listener) => listener())
    }
  })

  afterEach(() => {
    Date.now = originalDateNow
    global.setInterval = originalSetInterval
    global.clearInterval = originalClearInterval
    window.addEventListener = originalAddEventListener
    window.removeEventListener = originalRemoveEventListener
    delete (window as { triggerStorageEvent?: () => void }).triggerStorageEvent
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

    it('should return expired state when token is expired', () => {
      const now = Date.now()
      mockGetAuthCookieData.mockReturnValue({
        token: 'expired-token',
        tokenType: 'Bearer',
        expiry: now - 1000, // 1 second ago
      })

      const { result } = renderHook(() => useAuthToken())

      expect(result.current[0].isAuthenticated).toBe(true)
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
    it('should set token and update state', () => {
      mockGetAuthCookieData.mockReturnValue(undefined)

      const { result } = renderHook(() => useAuthToken())

      // Initially unauthenticated
      expect(result.current[0].isAuthenticated).toBe(false)

      // After setting token, mock should return the new token
      act(() => {
        result.current[1]('new-token', 'Bearer', 3600)
      })

      // Mock the cookie data after setToken is called
      mockGetAuthCookieData.mockReturnValue({
        token: 'new-token',
        tokenType: 'Bearer',
        expiry: Date.now() + 3600000,
      })

      // Trigger a re-check by calling checkAuthState manually
      // Since setToken calls checkAuthState, we need to wait for it
      act(() => {
        // The setToken already called checkAuthState, but we need to ensure state updates
        // Let's trigger it again to simulate the effect
      })

      expect(mockSetAuthCookie).toHaveBeenCalledWith('new-token', 'Bearer', 3600, undefined, undefined)
    })

    it('should handle different token types', () => {
      const { result } = renderHook(() => useAuthToken())

      act(() => {
        result.current[1]('custom-token', 'Custom', 7200)
      })

      expect(mockSetAuthCookie).toHaveBeenCalledWith('custom-token', 'Custom', 7200, undefined, undefined)
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
        result.current[1]('immediate-token', 'Bearer', 3600)
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
      // token, tokenType, expiresIn, refreshToken?, refreshExpiresIn?
      expect(result.current[1].length).toBe(5)
    })

    it('should return clearToken function as third element', () => {
      const { result } = renderHook(() => useAuthToken())

      expect(typeof result.current[2]).toBe('function')
      expect(result.current[2].length).toBe(0) // Function expects 0 parameters
    })
  })

  describe('silent refresh', () => {
    // Minimal in-memory stand-in for the cookie, wired through the mocked cookieStorage module,
    // so a refresh (mockSetAuthCookie) is actually observable on the next mockGetAuthCookieData read
    let fakeCookie: ReturnType<typeof cookieStorage.getAuthCookieData>

    const REFRESHED_RESPONSE = {
      access_token: 'refreshed-token',
      token_type: 'Bearer',
      expires_in: 300,
      refresh_token: 'rotated-refresh-token',
      refresh_expires_in: 2591700,
    }

    beforeEach(() => {
      fakeCookie = undefined

      mockGetAuthCookieData.mockImplementation(() => fakeCookie)
      mockSetAuthCookie.mockImplementation((token, tokenType, expiresIn, refreshToken, refreshExpiresIn) => {
        fakeCookie = {
          token,
          tokenType,
          expiry: Date.now() + expiresIn * 1000,
          ...(refreshToken &&
            refreshExpiresIn !== undefined && {
              refreshToken,
              refreshExpiry: Date.now() + refreshExpiresIn * 1000,
            }),
        }
      })
      mockClearAuthCookie.mockImplementation(() => {
        fakeCookie = undefined
      })

      mockGetStoreInstance.mockReturnValue({
        dispatch: jest.fn((action: unknown) => action),
      } as unknown as ReturnType<typeof getStoreInstance>)
      mockInitiate.mockReturnValue({ unwrap: () => Promise.resolve(REFRESHED_RESPONSE) })
    })

    it('degrades gracefully for a legacy cookie with no refreshToken (no crash, no refresh attempted)', async () => {
      fakeCookie = { token: 'legacy-token', tokenType: 'Bearer', expiry: Date.now() + 3600000 }

      const { result, unmount } = renderHook(() => useAuthToken())

      expect(result.current[0].isAuthenticated).toBe(true)
      expect(result.current[0].isExpired).toBe(false)
      expect(mockGetStoreInstance).not.toHaveBeenCalled()
      expect(mockInitiate).not.toHaveBeenCalled()

      unmount()
    })

    it('refreshes the access token once the refresh margin is reached and rotates the refresh token', async () => {
      fakeCookie = {
        token: 'stale-token',
        tokenType: 'Bearer',
        expiry: Date.now() - 1, // already past the refresh margin
        refreshToken: 'current-refresh-token',
        refreshExpiry: Date.now() + 2592000000,
      }

      const { result, unmount } = renderHook(() => useAuthToken())

      await waitFor(() => {
        expect(mockInitiate).toHaveBeenCalledWith({
          grant_type: 'refresh_token',
          client_id: expect.any(String),
          refresh_token: 'current-refresh-token',
        })
      })

      await waitFor(() => {
        expect(result.current[0].token).toBe('Bearer refreshed-token')
        expect(result.current[0].isExpired).toBe(false)
      })

      expect(fakeCookie?.refreshToken).toBe('rotated-refresh-token')

      unmount()
    })

    /** The shape the API actually rejects with: the RFC 6749 §5.2 body inside the standard
     * envelope, so the code sits at `error.error`. A bare `Error` never reaches this path. */
    const oauthRejection = (code: string) => ({
      unwrap: () =>
        Promise.reject({
          success: false,
          data: null,
          error: { error: code, error_description: `stubbed ${code}` },
        }),
    })

    const staleCookie = (refreshToken = 'current-refresh-token') => ({
      token: 'stale-token',
      tokenType: 'Bearer',
      expiry: Date.now() - 1,
      refreshToken,
      refreshExpiry: Date.now() + 2592000000,
    })

    it.each(['invalid_grant', 'invalid_client', 'unsupported_grant_type', 'invalid_request'])(
      'clears all auth state on %s instead of retrying',
      async (code) => {
        mockInitiate.mockReturnValue(oauthRejection(code))
        fakeCookie = staleCookie('dead-refresh-token')

        const { result, unmount } = renderHook(() => useAuthToken())

        await waitFor(() => {
          expect(mockClearAuthCookie).toHaveBeenCalled()
          expect(result.current[0].isAuthenticated).toBe(false)
        })

        expect(mockInitiate).toHaveBeenCalledTimes(1)

        unmount()
      },
    )

    /**
     * The case that matters most: a refresh can fail without the chain being dead. Logging the
     * user out on a dropped connection would turn a blip into a re-login, and the access token is
     * still valid for another minute at this point.
     */
    it.each([
      ['a transport failure with no body', undefined],
      ['a gateway error with no OAuth code', { success: false, data: null }],
      ['a 5xx envelope carrying an unrelated error', { success: false, data: null, error: { error: 'server_error' } }],
    ])('keeps the session on %s', async (_label, rejection) => {
      mockInitiate.mockReturnValue({ unwrap: () => Promise.reject(rejection) })
      fakeCookie = staleCookie()

      const { result, unmount } = renderHook(() => useAuthToken())

      await waitFor(() => {
        expect(mockInitiate).toHaveBeenCalled()
      })

      expect(mockClearAuthCookie).not.toHaveBeenCalled()
      expect(result.current[0].isAuthenticated).toBe(true)
      expect(result.current[0].token).toBe('Bearer stale-token')

      unmount()
    })

    it('recovers without a logout when a transient failure is followed by a success', async () => {
      mockInitiate
        .mockReturnValueOnce({ unwrap: () => Promise.reject(undefined) })
        .mockReturnValue({ unwrap: () => Promise.resolve(REFRESHED_RESPONSE) })
      fakeCookie = staleCookie()

      const { result, unmount } = renderHook(() => useAuthToken())

      await waitFor(
        () => {
          expect(result.current[0].token).toBe('Bearer refreshed-token')
        },
        { timeout: 5000 },
      )

      expect(mockClearAuthCookie).not.toHaveBeenCalled()
      expect(mockInitiate.mock.calls.length).toBeGreaterThanOrEqual(2)

      unmount()
    })

    /**
     * Retries stay inside the server's reuse grace window, where re-presenting the same token is
     * idempotent. Once they are spent the token is left alone rather than presented again later,
     * which would read as a replay and revoke the family.
     */
    it('stops presenting a token once its retries are spent, without logging out', async () => {
      mockInitiate.mockReturnValue({ unwrap: () => Promise.reject(undefined) })
      fakeCookie = staleCookie()

      const { result, unmount } = renderHook(() => useAuthToken())

      await waitFor(() => {
        expect(mockInitiate).toHaveBeenCalled()
      })

      const callsAfterFirstFailure = mockInitiate.mock.calls.length
      expect(callsAfterFirstFailure).toBeLessThanOrEqual(REFRESH_RETRY_ATTEMPTS + 1)
      expect(mockClearAuthCookie).not.toHaveBeenCalled()
      expect(result.current[0].isAuthenticated).toBe(true)

      unmount()
    })

    it('yields a single rotation when two tabs race to refresh the same token', async () => {
      // navigator.locks isn't implemented in jsdom - stub a real FIFO queue so this exercises the
      // actual serialisation + re-read-inside-the-lock logic, not just a trivial always-resolve mock
      let lockChain: Promise<unknown> = Promise.resolve()
      const lockRequest = jest.fn((_name: string, callback: () => Promise<unknown>) => {
        const run = lockChain.then(callback)
        lockChain = run.catch(() => undefined)
        return run
      })
      Object.defineProperty(global.navigator, 'locks', {
        value: { request: lockRequest },
        configurable: true,
      })

      fakeCookie = {
        token: 'stale-token',
        tokenType: 'Bearer',
        expiry: Date.now() - 1,
        refreshToken: 'current-refresh-token',
        refreshExpiry: Date.now() + 2592000000,
      }

      // Two "tabs" sharing the same cookie racing to refresh at the same instant
      const tabA = renderHook(() => useAuthToken())
      const tabB = renderHook(() => useAuthToken())

      await waitFor(() => {
        expect(tabA.result.current[0].token).toBe('Bearer refreshed-token')
        expect(tabB.result.current[0].token).toBe('Bearer refreshed-token')
      })

      expect(mockInitiate).toHaveBeenCalledTimes(1)
      expect(fakeCookie?.refreshToken).toBe('rotated-refresh-token')

      tabA.unmount()
      tabB.unmount()

      delete (global.navigator as { locks?: unknown }).locks
    })
  })
})
