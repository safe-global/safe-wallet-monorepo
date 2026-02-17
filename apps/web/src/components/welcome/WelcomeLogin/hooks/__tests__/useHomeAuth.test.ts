import { renderHook, act } from '@/tests/test-utils'
import { useHomeAuth } from '../useHomeAuth'
import * as store from '@/store'
import * as siweModule from '@/services/siwe/useSiwe'
import * as analytics from '@/services/analytics'
import * as exceptionsModule from '@/services/exceptions'
import { setAuthenticated } from '@/store/authSlice'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockSignIn = jest.fn()
const mockDispatch = jest.fn()

jest.mock('@/services/siwe/useSiwe', () => ({
  useSiwe: jest.fn(() => ({
    signIn: mockSignIn,
    loading: false,
  })),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SetupOptions {
  isAuthenticated?: boolean
  loading?: boolean
}

const setupMocks = ({ isAuthenticated = false, loading = false }: SetupOptions = {}) => {
  jest.spyOn(store, 'useAppDispatch').mockReturnValue(mockDispatch)
  jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
    const fakeState = {
      auth: {
        sessionExpiresAt: isAuthenticated ? Date.now() + 86400000 : null,
        lastUsedSpace: null,
        isStoreHydrated: true,
      },
    }
    return selector(fakeState as unknown as store.RootState)
  })
  ;(siweModule.useSiwe as jest.Mock).mockReturnValue({
    signIn: mockSignIn,
    loading,
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useHomeAuth', () => {
  const mockOnSuccess = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-06-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return performAuth function and loading state', () => {
    setupMocks()

    const { result } = renderHook(() => useHomeAuth({ onSuccess: mockOnSuccess }))

    expect(result.current.performAuth).toBeDefined()
    expect(typeof result.current.performAuth).toBe('function')
    expect(result.current.loading).toBe(false)
  })

  it('should return loading true when SIWE is loading', () => {
    setupMocks({ loading: true })

    const { result } = renderHook(() => useHomeAuth({ onSuccess: mockOnSuccess }))

    expect(result.current.loading).toBe(true)
  })

  it('should not proceed when loading is true', async () => {
    setupMocks({ loading: true })

    const { result } = renderHook(() => useHomeAuth({ onSuccess: mockOnSuccess }))

    await act(async () => {
      await result.current.performAuth()
    })

    expect(mockSignIn).not.toHaveBeenCalled()
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  // -----------------------------------------------------------------------
  // User is not authenticated
  // -----------------------------------------------------------------------

  describe('when user is not authenticated', () => {
    it('should sign in and call onSuccess on successful SIWE auth', async () => {
      setupMocks({ isAuthenticated: false })
      mockSignIn.mockResolvedValue({ data: { token: 'abc' } })

      const { result } = renderHook(() => useHomeAuth({ onSuccess: mockOnSuccess }))

      await act(async () => {
        await result.current.performAuth()
      })

      expect(analytics.trackEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: SPACE_EVENTS.SIGN_IN_BUTTON.action,
        }),
      )
      expect(mockSignIn).toHaveBeenCalled()
      expect(mockDispatch).toHaveBeenCalledWith(setAuthenticated(expect.any(Number)))
      expect(mockOnSuccess).toHaveBeenCalled()
    })

    it('should not call onSuccess when signIn returns null', async () => {
      setupMocks({ isAuthenticated: false })
      mockSignIn.mockResolvedValue(null)

      const { result } = renderHook(() => useHomeAuth({ onSuccess: mockOnSuccess }))

      await act(async () => {
        await result.current.performAuth()
      })

      expect(mockSignIn).toHaveBeenCalled()
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('should not call onSuccess when signIn returns undefined', async () => {
      setupMocks({ isAuthenticated: false })
      mockSignIn.mockResolvedValue(undefined)

      const { result } = renderHook(() => useHomeAuth({ onSuccess: mockOnSuccess }))

      await act(async () => {
        await result.current.performAuth()
      })

      expect(mockSignIn).toHaveBeenCalled()
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('should throw and handle error when signIn returns an error', async () => {
      setupMocks({ isAuthenticated: false })
      const signInError = new Error('User rejected')
      mockSignIn.mockResolvedValue({ error: signInError })

      const { result } = renderHook(() => useHomeAuth({ onSuccess: mockOnSuccess, onError: mockOnError }))

      await act(async () => {
        await result.current.performAuth()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(exceptionsModule.logError).toHaveBeenCalled()
      expect(mockOnError).toHaveBeenCalledWith(signInError)
      // showNotification returns a thunk, so dispatch receives a function
      expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should handle error when signIn throws', async () => {
      setupMocks({ isAuthenticated: false })
      const signInError = new Error('Network error')
      mockSignIn.mockRejectedValue(signInError)

      const { result } = renderHook(() => useHomeAuth({ onSuccess: mockOnSuccess, onError: mockOnError }))

      await act(async () => {
        await result.current.performAuth()
      })

      expect(mockOnSuccess).not.toHaveBeenCalled()
      expect(exceptionsModule.logError).toHaveBeenCalled()
      expect(mockOnError).toHaveBeenCalledWith(signInError)
    })

    it('should show error notification even without onError callback', async () => {
      setupMocks({ isAuthenticated: false })
      mockSignIn.mockRejectedValue(new Error('fail'))

      const { result } = renderHook(() => useHomeAuth({ onSuccess: mockOnSuccess }))

      await act(async () => {
        await result.current.performAuth()
      })

      expect(exceptionsModule.logError).toHaveBeenCalled()
      // showNotification returns a thunk, so dispatch receives a function
      expect(mockDispatch).toHaveBeenCalledWith(expect.any(Function))
    })
  })

  // -----------------------------------------------------------------------
  // User is already authenticated
  // -----------------------------------------------------------------------

  describe('when user is already authenticated', () => {
    it('should skip sign-in and call onSuccess directly', async () => {
      setupMocks({ isAuthenticated: true })

      const { result } = renderHook(() => useHomeAuth({ onSuccess: mockOnSuccess }))

      await act(async () => {
        await result.current.performAuth()
      })

      expect(mockSignIn).not.toHaveBeenCalled()
      expect(mockOnSuccess).toHaveBeenCalled()
    })

    it('should not track sign-in analytics event when already authenticated', async () => {
      setupMocks({ isAuthenticated: true })

      const { result } = renderHook(() => useHomeAuth({ onSuccess: mockOnSuccess }))

      await act(async () => {
        await result.current.performAuth()
      })

      expect(analytics.trackEvent).not.toHaveBeenCalled()
    })
  })
})
