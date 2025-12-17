import { renderHook, act, waitFor } from '@testing-library/react'
import { useHypernativeOAuth } from '../useHypernativeOAuth'
import { setAuthCookie, clearAuthCookie } from '../../store/cookieStorage'
import Cookies from 'js-cookie'

// Mock js-cookie
jest.mock('js-cookie', () => ({
  set: jest.fn(),
  get: jest.fn(),
  remove: jest.fn(),
}))

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

// Mock useAppDispatch
const mockDispatch = jest.fn()
jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: jest.fn(),
}))

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
      clientId: 'SAFE_WALLET_WEB',
      redirectUri: '',
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

// Mock cookies
const mockCookies: Record<string, string> = {}
const mockCookiesSet = Cookies.set as jest.MockedFunction<typeof Cookies.set>
const mockCookiesGet = Cookies.get as jest.MockedFunction<typeof Cookies.get>
const mockCookiesRemove = Cookies.remove as jest.MockedFunction<typeof Cookies.remove>

// Setup cookie mocks
mockCookiesSet.mockImplementation((name: string, value: string) => {
  mockCookies[name] = value
  return value
})

mockCookiesGet.mockImplementation(((name?: string) => {
  if (name === undefined) {
    return mockCookies as any
  }
  return mockCookies[name] || undefined
}) as any)

mockCookiesRemove.mockImplementation((name: string) => {
  delete mockCookies[name]
})

describe('useHypernativeOAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDispatch.mockClear()

    // Clear mock cookies
    Object.keys(mockCookies).forEach((key) => delete mockCookies[key])

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

    // Setup window.location
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000',
        protocol: 'http:',
      },
      writable: true,
    })
  })

  afterEach(() => {
    window.open = originalWindowOpen
  })

  describe('initial state', () => {
    it('should return unauthenticated state by default', () => {
      const { result } = renderHook(() => useHypernativeOAuth())

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.isTokenExpired).toBe(true)
    })

    it('should return authenticated state when token exists', async () => {
      // Pre-populate cookie with auth token
      setAuthCookie('test-token', 3600)

      const { result } = renderHook(() => useHypernativeOAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.isTokenExpired).toBe(false)
      })

      // Cleanup
      clearAuthCookie()
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
      const { result } = renderHook(() => useHypernativeOAuth())

      act(() => {
        result.current.initiateLogin()
      })
    })

    it('should generate and store mock token', async () => {
      const { result } = renderHook(() => useHypernativeOAuth())

      act(() => {
        result.current.initiateLogin()
      })

      // Advance timers to allow mock token to be set (MOCK_AUTH_DELAY_MS = 1000ms)
      await act(async () => {
        jest.advanceTimersByTime(1000) // Mock auth delay
      })

      // Verify token is stored in cookie first
      const authCookie = Cookies.get('hn_auth')
      expect(authCookie).toBeDefined()
      if (authCookie) {
        const authData = JSON.parse(authCookie)
        expect(authData.token).toMatch(/^mock-token-\d+$/)
        expect(authData.expiry).toBeGreaterThan(Date.now())
      }

      // Advance timers to trigger the next polling interval check.
      // The initial checkAuthState() runs on mount (before token is set), so we need to wait
      // for the next polling check which happens at 5000ms intervals (AUTH_POLLING_INTERVAL).
      await act(async () => {
        jest.advanceTimersByTime(5000) // Polling interval check (AUTH_POLLING_INTERVAL = 5000ms)
      })

      // Verify authentication state is updated
      expect(result.current.isAuthenticated).toBe(true)

      // Cleanup
      clearAuthCookie()
    })

    it('should not open popup in mock mode', async () => {
      const { result } = renderHook(() => useHypernativeOAuth())

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

    it('should generate PKCE parameters and store in secure cookie', async () => {
      const { result } = renderHook(() => useHypernativeOAuth())

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalled())
      })

      // Verify PKCE data is stored in cookie as single JSON object
      expect(mockCookiesSet).toHaveBeenCalledWith('hn_pkce', expect.any(String), expect.any(Object))

      // Verify the stored data contains both state and codeVerifier
      const pkceCall = mockCookiesSet.mock.calls.find((call) => call[0] === 'hn_pkce')
      expect(pkceCall).toBeDefined()
      const storedData = JSON.parse(pkceCall![1] as string)
      expect(storedData).toHaveProperty('state')
      expect(storedData).toHaveProperty('codeVerifier')
      expect(storedData.state).toBe('test-uuid-1234-5678-90ab-cdef')
      expect(storedData.codeVerifier).toBeTruthy()

      // Verify cookie options include security settings
      const cookieOptions = pkceCall![2]
      expect(cookieOptions).toHaveProperty('path', '/')
      expect(cookieOptions).toHaveProperty('sameSite', 'lax')
      expect(cookieOptions).toHaveProperty('expires')
    })

    it('should open popup with correct URL and dimensions', async () => {
      const { result } = renderHook(() => useHypernativeOAuth())

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
      expect(url).toContain('state=')
      expect(url).toContain('code_challenge=')
      expect(url).toContain('code_challenge_method=S256')
    })

    it('should fallback to new tab when popup is blocked (null)', async () => {
      const mockTab = { closed: false, close: jest.fn() }
      mockWindowOpen.mockReturnValueOnce(null).mockReturnValueOnce(mockTab)

      const { result } = renderHook(() => useHypernativeOAuth())

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

      const { result } = renderHook(() => useHypernativeOAuth())

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
    })

    it('should fallback to new tab when popup is immediately closed', async () => {
      const mockTab = { closed: false, close: jest.fn() }
      const mockPopup = { closed: true, close: jest.fn() }
      mockWindowOpen.mockReturnValueOnce(mockPopup).mockReturnValueOnce(mockTab)

      const { result } = renderHook(() => useHypernativeOAuth())

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalledTimes(2))
      })

      // First call: attempt popup (returns closed popup)
      expect(mockWindowOpen).toHaveBeenNthCalledWith(1, expect.any(String), 'hypernative-oauth', expect.any(String))

      // Second call: fallback to new tab (via requestAnimationFrame)
      await waitFor(() => expect(mockWindowOpen).toHaveBeenCalledTimes(2))
    })
  })

  describe('logout', () => {
    it('should clear auth token', async () => {
      // Pre-populate cookie with auth token
      setAuthCookie('test-token', 3600)

      const { result } = renderHook(() => useHypernativeOAuth())

      // Wait for initial state to be set
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      act(() => {
        result.current.logout()
      })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false)
      })

      // Verify cookie is cleared
      expect(Cookies.get('hn_auth')).toBeUndefined()
    })
  })

  describe('token expiry', () => {
    it('should detect expired tokens', async () => {
      // Set token with expiry in the past (negative expiresIn means expired)
      // We'll set it directly in the cookie with a past expiry timestamp
      const expiredData = {
        token: 'expired-token',
        expiry: Date.now() - 1000, // Expired 1 second ago
      }
      Cookies.set('hn_auth', JSON.stringify(expiredData))

      const { result } = renderHook(() => useHypernativeOAuth())

      // Wait for state to update
      await waitFor(() => {
        // isAuthenticated should be false when token is expired
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.isTokenExpired).toBe(true)
      })

      // Cleanup
      clearAuthCookie()
    })

    it('should detect valid tokens', async () => {
      setAuthCookie('valid-token', 3600)

      const { result } = renderHook(() => useHypernativeOAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.isTokenExpired).toBe(false)
      })

      // Cleanup
      clearAuthCookie()
    })
  })

  describe('cleanup', () => {
    it('should cleanup timers on unmount', async () => {
      jest.useFakeTimers()
      const mockPopup = { closed: false, close: jest.fn() }
      mockWindowOpen.mockReturnValue(mockPopup)

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      const { result, unmount } = renderHook(() => useHypernativeOAuth())

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
