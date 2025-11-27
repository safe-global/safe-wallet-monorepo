import { renderHook, act, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { useHypernativeOAuth, HN_AUTH_SUCCESS_EVENT } from '../useHypernativeOAuth'
import { hnAuthSlice } from '../../store/hnAuthSlice'
import * as oauthConfig from '../../config/oauth'

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

    // Setup crypto mocks
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: mockGetRandomValues,
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
      jest.spyOn(oauthConfig, 'MOCK_AUTH_ENABLED', 'get').mockReturnValue(true)
      jest.useFakeTimers()
    })

    afterEach(() => {
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
      jest.spyOn(oauthConfig, 'MOCK_AUTH_ENABLED', 'get').mockReturnValue(false)
    })

    it('should generate PKCE parameters and store in sessionStorage', async () => {
      const { result } = renderHook(() => useHypernativeOAuth(), { wrapper: createWrapper() })

      await act(async () => {
        result.current.initiateLogin()
        await waitFor(() => expect(mockWindowOpen).toHaveBeenCalled())
      })

      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('hn_pkce_verifier', expect.any(String))
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('hn_oauth_state', expect.any(String))
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
      expect(url).toContain('scope=read%3Aanalysis+write%3Aanalysis')
      expect(url).toContain('state=')
      expect(url).toContain('code_challenge=')
      expect(url).toContain('code_challenge_method=S256')
    })

    it('should fallback to new tab when popup is blocked', async () => {
      mockWindowOpen.mockReturnValueOnce(null)

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

      expect(result.current.isAuthenticated).toBe(true) // Still marked as authenticated
      expect(result.current.isTokenExpired).toBe(true) // But token is expired
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
})
