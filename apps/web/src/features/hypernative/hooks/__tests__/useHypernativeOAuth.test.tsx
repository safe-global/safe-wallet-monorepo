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

// Mock useSafeInfo and useChainId
const mockSafeInfoValues = { safeAddress: '', safe: {}, safeLoaded: false, safeLoading: false }
const mockChainIdValue = { chainId: '' }

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => mockSafeInfoValues,
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => mockChainIdValue.chainId,
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

    // Reset mock values
    mockSafeInfoValues.safeAddress = ''
    mockChainIdValue.chainId = ''

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
      expect(result.current.isTokenExpired).toBe(false)
    })

    it('should return authenticated state when token exists', async () => {
      // Pre-populate cookie with auth token
      setAuthCookie('test-token', 'Bearer', 3600)

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
        expect(authData.tokenType).toBe('Bearer')
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

    it('should set token with Bearer type in mock mode', async () => {
      const { result } = renderHook(() => useHypernativeOAuth())

      act(() => {
        result.current.initiateLogin()
      })

      await act(async () => {
        jest.advanceTimersByTime(1000) // Mock auth delay
      })

      // Verify token is stored with Bearer type
      const authCookie = Cookies.get('hn_auth')
      expect(authCookie).toBeDefined()
      if (authCookie) {
        const authData = JSON.parse(authCookie)
        expect(authData.tokenType).toBe('Bearer')
        expect(authData.token).toMatch(/^mock-token-\d+$/)
      }

      // Advance timers to trigger polling check
      await act(async () => {
        jest.advanceTimersByTime(5000) // Polling interval
      })

      expect(result.current.isAuthenticated).toBe(true)

      // Cleanup
      clearAuthCookie()
    })

    it('should use correct expiry time for mock tokens', async () => {
      const { result } = renderHook(() => useHypernativeOAuth())

      act(() => {
        result.current.initiateLogin()
      })

      await act(async () => {
        jest.advanceTimersByTime(1000) // Mock auth delay
      })

      // Verify expiry is set correctly (10 minutes = 10 * 60 seconds)
      const authCookie = Cookies.get('hn_auth')
      expect(authCookie).toBeDefined()
      if (authCookie) {
        const authData = JSON.parse(authCookie)
        const expectedExpiry = Date.now() + 10 * 60 * 1000 // 10 minutes in ms
        // Allow 1 second tolerance for test execution time
        expect(authData.expiry).toBeGreaterThanOrEqual(Date.now() + 10 * 60 * 1000 - 1000)
        expect(authData.expiry).toBeLessThanOrEqual(expectedExpiry + 1000)
      }

      // Cleanup
      clearAuthCookie()
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

    it('should include chain and safe parameters in URL when provided', async () => {
      mockChainIdValue.chainId = '1'
      mockSafeInfoValues.safeAddress = '0x1234567890123456789012345678901234567890'

      const { result } = renderHook(() => useHypernativeOAuth())

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalled())
      })

      const callArgs = mockWindowOpen.mock.calls[0]
      const url = callArgs[0] as string

      expect(url).toContain(`chain=${mockChainIdValue.chainId}`)
      expect(url).toContain(`safe=${mockSafeInfoValues.safeAddress}`)
    })

    it('should not include chain and safe parameters when not provided', async () => {
      const { result } = renderHook(() => useHypernativeOAuth())

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalled())
      })

      const callArgs = mockWindowOpen.mock.calls[0]
      const url = callArgs[0] as string

      expect(url).not.toContain('chain=')
      expect(url).not.toContain('safe=')
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
      setAuthCookie('test-token', 'Bearer', 3600)

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
        tokenType: 'Bearer',
        expiry: Date.now() - 1000, // Expired 1 second ago
      }
      Cookies.set('hn_auth', JSON.stringify(expiredData))

      const { result } = renderHook(() => useHypernativeOAuth())

      // Wait for state to update
      await waitFor(() => {
        // When token is expired, getAuthCookieData automatically cleans it up,
        // so there's no token, which means isAuthenticated is false and isTokenExpired is false
        expect(result.current.isAuthenticated).toBe(false)
        expect(result.current.isTokenExpired).toBe(false)
      })

      // Verify cookie was cleaned up
      expect(Cookies.get('hn_auth')).toBeUndefined()

      // Cleanup
      clearAuthCookie()
    })

    it('should detect valid tokens', async () => {
      setAuthCookie('valid-token', 'Bearer', 3600)

      const { result } = renderHook(() => useHypernativeOAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.isTokenExpired).toBe(false)
      })

      // Cleanup
      clearAuthCookie()
    })

    it('should handle tokens with different token types', async () => {
      setAuthCookie('custom-token', 'Custom', 3600)

      const { result } = renderHook(() => useHypernativeOAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.isTokenExpired).toBe(false)
      })

      // Verify cookie contains tokenType
      const authCookie = Cookies.get('hn_auth')
      expect(authCookie).toBeDefined()
      if (authCookie) {
        const authData = JSON.parse(authCookie)
        expect(authData.tokenType).toBe('Custom')
      }

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

    it('should cleanup polling interval on unmount', async () => {
      jest.useFakeTimers()
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      const { unmount } = renderHook(() => useHypernativeOAuth())

      // Advance timers to ensure polling is set up
      await act(async () => {
        jest.advanceTimersByTime(100)
      })

      unmount()

      // Should cleanup polling interval
      expect(clearIntervalSpy).toHaveBeenCalled()

      clearIntervalSpy.mockRestore()
      jest.useRealTimers()
    })
  })

  describe('token type handling', () => {
    it('should handle missing tokenType gracefully', async () => {
      // Set cookie without tokenType (legacy format)
      const legacyData = {
        token: 'legacy-token',
        expiry: Date.now() + 3600000,
      }
      Cookies.set('hn_auth', JSON.stringify(legacyData))

      const { result } = renderHook(() => useHypernativeOAuth())

      // Should still work but token might be undefined if tokenType is missing
      // The hook will check for token existence
      await waitFor(() => {
        // Token exists but tokenType is missing, so token value might be undefined
        // but isAuthenticated should still be true if token exists
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Cleanup
      clearAuthCookie()
    })

    it('should handle empty tokenType', async () => {
      const dataWithEmptyType = {
        token: 'test-token',
        tokenType: '',
        expiry: Date.now() + 3600000,
      }
      Cookies.set('hn_auth', JSON.stringify(dataWithEmptyType))

      const { result } = renderHook(() => useHypernativeOAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Cleanup
      clearAuthCookie()
    })
  })
})
