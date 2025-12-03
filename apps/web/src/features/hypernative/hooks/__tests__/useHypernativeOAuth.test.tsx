import { renderHook, act, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useHypernativeOAuth, HN_AUTH_SUCCESS_EVENT, HN_AUTH_ERROR_EVENT } from '../useHypernativeOAuth'
import { hnAuthSlice } from '../../store/hnAuthSlice'

// Mock notifications
const mockShowNotification = jest.fn()
jest.mock('@/store/notificationsSlice', () => {
  const actual = jest.requireActual('@/store/notificationsSlice')
  return {
    ...actual,
    showNotification: (payload: Parameters<typeof actual.showNotification>[0]) => {
      mockShowNotification(payload)
      return () => 'mock-notification-id'
    },
  }
})

// Mock oauth config to ensure consistent test values
const mockGetRedirectUri = jest.fn(() => 'http://localhost:3000/hypernative/oauth-callback')
let mockAuthEnabled = false

jest.mock('../../config/oauth', () => {
  const actual = jest.requireActual('../../config/oauth')
  return {
    ...actual,
    HYPERNATIVE_OAUTH_CONFIG: {
      ...actual.HYPERNATIVE_OAUTH_CONFIG,
      authUrl: 'https://mock-hn-auth.example.com/oauth/authorize',
      tokenUrl: 'https://mock-hn-auth.example.com/oauth/token',
      apiBaseUrl: 'https://mock-hn-api.example.com',
      clientId: 'SAFE_WALLET_SPA',
      redirectUri: '',
      scope: 'read',
    },
    get getRedirectUri() {
      return mockGetRedirectUri
    },
    get MOCK_AUTH_ENABLED() {
      return mockAuthEnabled
    },
  }
})

// Mock window.open
const mockWindowOpen = jest.fn()
const originalWindowOpen = window.open

// Mock crypto APIs
const mockGetRandomValues = jest.fn((array: Uint8Array) => {
  for (let i = 0; i < array.length; i++) {
    array[i] = Math.floor(Math.random() * 256)
  }
  return array
})

const mockRandomUUID = jest.fn(() => 'test-uuid-1234-5678-90ab-cdef')

const mockDigest = jest.fn(async () => {
  return new ArrayBuffer(32)
})

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {}
const sessionStorageMock = {
  getItem: jest.fn((key: string) => mockSessionStorage[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockSessionStorage[key] = value
  }),
  removeItem: jest.fn((key: string) => {
    delete mockSessionStorage[key]
  }),
  clear: jest.fn(() => {
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key])
  }),
}

describe('useHypernativeOAuth', () => {
  let store: ReturnType<typeof createTestStore>

  function createTestStore() {
    return configureStore({
      reducer: {
        [hnAuthSlice.name]: hnAuthSlice.reducer,
      },
    })
  }

  function createWrapper() {
    const Wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>
    Wrapper.displayName = 'TestWrapper'
    return Wrapper
  }

  beforeEach(() => {
    store = createTestStore()
    jest.clearAllMocks()
    sessionStorageMock.clear()

    // Setup window.open mock
    window.open = mockWindowOpen
    mockWindowOpen.mockReturnValue({ closed: false, close: jest.fn() })

    // Mock requestAnimationFrame
    global.requestAnimationFrame = jest.fn((cb) => {
      setTimeout(cb, 0)
      return 1
    }) as unknown as typeof requestAnimationFrame

    // Setup crypto mocks
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: mockGetRandomValues,
        randomUUID: mockRandomUUID,
        subtle: {
          digest: mockDigest,
        },
      },
      writable: true,
    })

    // Setup sessionStorage mock
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    })

    // Setup window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
      },
      writable: true,
    })
  })

  afterEach(() => {
    window.open = originalWindowOpen
  })

  describe('initial state', () => {
    it('should return unauthenticated state by default', () => {
      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isTokenExpired).toBe(true)
      expect(result.current.loading).toBe(false)
    })

    it('should return authenticated state when token exists', () => {
      // Pre-populate store with auth token
      store.dispatch(
        hnAuthSlice.actions.setAuthToken({
          token: 'test-token',
          expiresIn: 3600,
        }),
      )

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isTokenExpired).toBe(false)
    })
  })

  describe('initiateLogin - mock mode', () => {
    beforeEach(() => {
      mockAuthEnabled = true
      jest.useFakeTimers()
    })

    afterEach(() => {
      mockAuthEnabled = false
      jest.useRealTimers()
    })

    it('should set loading to true during login', () => {
      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      act(() => {
        result.current.initiateLogin()
      })

      expect(result.current.loading).toBe(true)
    })

    it('should generate and store mock token', async () => {
      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      act(() => {
        result.current.initiateLogin()
      })

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.loading).toBe(false)

      const state = store.getState()
      expect(state.hnAuth.authToken).toMatch(/^mock-token-\d+$/)
      expect(state.hnAuth.authTokenExpiry).toBeGreaterThan(Date.now())
    })

    it('should not open popup in mock mode', async () => {
      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      act(() => {
        result.current.initiateLogin()
      })

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      expect(mockWindowOpen).not.toHaveBeenCalled()
    })
  })

  describe('initiateLogin - real mode', () => {
    beforeEach(() => {
      mockAuthEnabled = false
    })

    it('should generate PKCE parameters and store in sessionStorage', async () => {
      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalled())
      })

      // Verify PKCE data is stored as single JSON object
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('hn_pkce', expect.any(String))

      // Verify the stored data contains both state and codeVerifier
      const pkceCall = sessionStorageMock.setItem.mock.calls.find((call) => call[0] === 'hn_pkce')
      expect(pkceCall).toBeDefined()
      const storedData = JSON.parse(pkceCall![1] as string)
      expect(storedData).toHaveProperty('state')
      expect(storedData).toHaveProperty('codeVerifier')
      expect(storedData.state).toBe('test-uuid-1234-5678-90ab-cdef')
      expect(storedData.codeVerifier).toBeTruthy()
    })

    it('should open popup with correct URL and dimensions', async () => {
      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalled())
      })

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://mock-hn-auth.example.com/oauth/authorize'),
        'hypernative-oauth',
        expect.stringContaining('width=600'),
      )

      const callArgs = mockWindowOpen.mock.calls[0]
      const url = callArgs[0] as string

      expect(url).toContain('response_type=code')
      expect(url).toContain('client_id=')
      expect(url).toContain('redirect_uri=')
      expect(url).toContain('scope=read')
      expect(url).toContain('state=')
      expect(url).toContain('code_challenge=')
      expect(url).toContain('code_challenge_method=S256')
    })

    it('should fallback to new tab when popup is blocked (null)', async () => {
      const mockTab = { closed: false, close: jest.fn() }
      mockWindowOpen.mockReturnValueOnce(null).mockReturnValueOnce(mockTab)

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalledTimes(2))
      })

      // First call: attempt popup
      expect(mockWindowOpen).toHaveBeenNthCalledWith(1, expect.any(String), 'hypernative-oauth', expect.any(String))

      // Second call: fallback to new tab
      expect(mockWindowOpen).toHaveBeenNthCalledWith(2, expect.any(String), '_blank')
    })

    it('should show notification with clickable link when both popup and tab are blocked', async () => {
      mockWindowOpen.mockReturnValueOnce(null).mockReturnValueOnce(null)

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalledTimes(2))
      })

      expect(mockShowNotification).toHaveBeenCalledWith({
        message: 'Popup blocked. Click the link below to complete authentication.',
        variant: 'error',
        groupKey: 'hypernative-auth-blocked',
        link: {
          onClick: expect.any(Function),
          title: 'Open authentication page',
        },
      })

      expect(result.current.loading).toBe(false)
    })

    it('should fallback to new tab when popup is immediately closed', async () => {
      const mockTab = { closed: false, close: jest.fn() }
      const mockPopup = { closed: true, close: jest.fn() }
      mockWindowOpen.mockReturnValueOnce(mockPopup).mockReturnValueOnce(mockTab)

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalledTimes(2))
      })

      // First call: attempt popup (returns closed popup)
      expect(mockWindowOpen).toHaveBeenNthCalledWith(1, expect.any(String), 'hypernative-oauth', expect.any(String))

      // Second call: fallback to new tab (via requestAnimationFrame)
      await waitFor(() => expect(mockWindowOpen).toHaveBeenCalledTimes(2))
    })

    it('should fallback to new tab when popup closes after delay', async () => {
      jest.useFakeTimers()
      const mockTab = { closed: false, close: jest.fn() }
      const mockPopup = { closed: false, close: jest.fn() }
      mockWindowOpen.mockReturnValueOnce(mockPopup).mockReturnValueOnce(mockTab)

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalled())
      })

      // Popup is initially open
      expect(mockWindowOpen).toHaveBeenCalledTimes(1)

      // Simulate popup closing after delay
      await act(async () => {
        Object.defineProperty(mockPopup, 'closed', { value: true, writable: true })
        jest.advanceTimersByTime(100)
      })

      // Should fallback to new tab
      await waitFor(() => expect(mockWindowOpen).toHaveBeenCalledTimes(2))

      jest.useRealTimers()
    })

    it('should set up popup monitoring when popup opens successfully', async () => {
      jest.useFakeTimers()
      const mockPopup = { closed: false, close: jest.fn() }
      mockWindowOpen.mockReturnValue(mockPopup)

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalled())
      })

      // Wait for delayed check
      await act(async () => {
        jest.advanceTimersByTime(100)
      })

      // Popup should still be monitored (not closed)
      expect(result.current.loading).toBe(true)

      // Simulate popup being closed without authentication
      await act(async () => {
        Object.defineProperty(mockPopup, 'closed', { value: true, writable: true })
        jest.advanceTimersByTime(500)
      })

      // Should show cancelled notification and reset loading
      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith({
          message: 'Authentication cancelled. Please try again to log in to Hypernative.',
          variant: 'error',
          groupKey: 'hypernative-auth-cancelled',
        })
        expect(result.current.loading).toBe(false)
      })

      jest.useRealTimers()
    })
  })

  describe('postMessage handling', () => {
    it('should ignore messages from different origins', async () => {
      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      // Create a fake message event from different origin
      const fakeEvent = new MessageEvent('message', {
        data: {
          type: HN_AUTH_SUCCESS_EVENT,
          token: 'malicious-token',
          expiresIn: 3600,
        },
        origin: 'https://evil.com',
      })

      await act(async () => {
        window.dispatchEvent(fakeEvent)
        await new Promise((resolve) => setTimeout(resolve, 100))
      })

      expect(result.current.isAuthenticated).toBe(false)

      const state = store.getState()
      expect(state.hnAuth.authToken).toBeUndefined()
    })

    it('should handle successful authentication and cleanup', async () => {
      jest.useFakeTimers()
      const mockPopup = { closed: false, close: jest.fn() }
      mockWindowOpen.mockReturnValue(mockPopup)

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalled())
        jest.advanceTimersByTime(100)
      })

      expect(result.current.loading).toBe(true)

      // Simulate successful authentication message
      const successEvent = new MessageEvent('message', {
        data: {
          type: HN_AUTH_SUCCESS_EVENT,
          token: 'test-token',
          expiresIn: 3600,
        },
        origin: 'http://localhost:3000',
      })

      await act(async () => {
        window.dispatchEvent(successEvent)
        jest.advanceTimersByTime(100)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.loading).toBe(false)
      expect(mockPopup.close).toHaveBeenCalled()

      const state = store.getState()
      expect(state.hnAuth.authToken).toBe('test-token')

      jest.useRealTimers()
    })

    it('should handle authentication error and cleanup', async () => {
      jest.useFakeTimers()
      const mockPopup = { closed: false, close: jest.fn() }
      mockWindowOpen.mockReturnValue(mockPopup)

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalled())
        jest.advanceTimersByTime(100)
      })

      expect(result.current.loading).toBe(true)

      // Simulate authentication error message
      const errorEvent = new MessageEvent('message', {
        data: {
          type: HN_AUTH_ERROR_EVENT,
          error: 'Authentication failed',
        },
        origin: 'http://localhost:3000',
      })

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      await act(async () => {
        window.dispatchEvent(errorEvent)
        jest.advanceTimersByTime(100)
      })

      expect(result.current.loading).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Hypernative OAuth error:', 'Authentication failed')
      expect(mockPopup.close).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
      jest.useRealTimers()
    })
  })

  describe('logout', () => {
    it('should clear auth token', () => {
      // Pre-populate store with auth token
      store.dispatch(
        hnAuthSlice.actions.setAuthToken({
          token: 'test-token',
          expiresIn: 3600,
        }),
      )

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      expect(result.current.isAuthenticated).toBe(true)

      act(() => {
        result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)

      const state = store.getState()
      expect(state.hnAuth.authToken).toBeUndefined()
    })
  })

  describe('token expiry', () => {
    it('should detect expired tokens', () => {
      // Set token with expiry in the past
      store.dispatch(
        hnAuthSlice.actions.setAuthToken({
          token: 'expired-token',
          expiresIn: -1,
        }),
      )

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      // isAuthenticated should be false when token is expired
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isTokenExpired).toBe(true)
    })

    it('should detect valid tokens', () => {
      store.dispatch(
        hnAuthSlice.actions.setAuthToken({
          token: 'valid-token',
          expiresIn: 3600,
        }),
      )

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.isTokenExpired).toBe(false)
    })
  })

  describe('timeout fallback', () => {
    beforeEach(() => {
      mockAuthEnabled = false
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should show cancelled notification after timeout when no message received', async () => {
      const mockTab = { closed: false, close: jest.fn() }
      mockWindowOpen.mockReturnValueOnce(null).mockReturnValueOnce(mockTab)

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalledTimes(2))
      })

      expect(result.current.loading).toBe(true)

      // Advance time past timeout (5 minutes)
      await act(async () => {
        jest.advanceTimersByTime(5 * 60 * 1000 + 100)
      })

      await waitFor(() => {
        expect(mockShowNotification).toHaveBeenCalledWith({
          message: 'Authentication cancelled. Please try again to log in to Hypernative.',
          variant: 'error',
          groupKey: 'hypernative-auth-cancelled',
        })
        expect(result.current.loading).toBe(false)
      })
    })

    it('should not show cancelled notification if message received before timeout', async () => {
      const mockTab = { closed: false, close: jest.fn() }
      mockWindowOpen.mockReturnValueOnce(null).mockReturnValueOnce(mockTab)

      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalledTimes(2))
      })

      // Send success message before timeout
      const successEvent = new MessageEvent('message', {
        data: {
          type: HN_AUTH_SUCCESS_EVENT,
          token: 'test-token',
          expiresIn: 3600,
        },
        origin: 'http://localhost:3000',
      })

      await act(async () => {
        window.dispatchEvent(successEvent)
      })

      // Advance time past timeout
      await act(async () => {
        jest.advanceTimersByTime(5 * 60 * 1000 + 100)
      })

      // Should not show cancelled notification since we received a message
      const cancelledNotifications = mockShowNotification.mock.calls.filter(
        (call) => call[0]?.groupKey === 'hypernative-auth-cancelled',
      )
      expect(cancelledNotifications).toHaveLength(0)
    })
  })

  describe('cleanup', () => {
    it('should cleanup timers on unmount', async () => {
      jest.useFakeTimers()
      const mockPopup = { closed: false, close: jest.fn() }
      mockWindowOpen.mockReturnValue(mockPopup)

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      const { result, unmount } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalled())
        jest.advanceTimersByTime(100)
      })

      // Unmount should cleanup
      unmount()

      // Should cleanup timers
      expect(clearIntervalSpy).toHaveBeenCalled()
      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearIntervalSpy.mockRestore()
      clearTimeoutSpy.mockRestore()
      jest.useRealTimers()
    })
  })
})
