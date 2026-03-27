import { renderHook, waitFor } from '@testing-library/react'
import { useOidcLoginCallback } from '../useOidcLoginCallback'
import { OIDC_AUTH_PENDING_KEY } from '../../constants'

const mockUnwrap = jest.fn()
const mockReplace = jest.fn()
const mockInitiate = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  cgwApi: {
    endpoints: {
      authGetMeV1: {
        initiate: (...args: unknown[]) => mockInitiate(...args),
      },
    },
  },
}))

const mockDispatch = jest.fn((action) => {
  // When dispatching the initiate thunk, return the unwrap handle
  if (action === mockInitiate.mock.results[mockInitiate.mock.results.length - 1]?.value) {
    return { unwrap: mockUnwrap }
  }
  return action
})

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/authSlice', () => ({
  setAuthenticated: (expiresAt: number) => ({ type: 'auth/setAuthenticated', payload: expiresAt }),
  setIsEmailLoginPending: (pending: boolean) => ({ type: 'auth/setIsEmailLoginPending', payload: pending }),
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: Record<string, string>) => ({ type: 'notifications/showNotification', payload }),
}))

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    pathname: '/welcome/spaces',
    replace: mockReplace,
  }),
}))

const mockUseHasFeature = jest.fn()
jest.mock('@/hooks/useChains', () => ({
  useHasFeature: (...args: unknown[]) => mockUseHasFeature(...args),
}))

describe('useOidcLoginCallback', () => {
  const originalLocation = window.location
  const initiateReturnValue = Symbol('initiate')

  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()

    jest.spyOn(Date, 'now').mockReturnValue(1000000)

    mockUseHasFeature.mockReturnValue(true)
    mockInitiate.mockReturnValue(initiateReturnValue)
    mockUnwrap.mockResolvedValue(undefined)
    mockDispatch.mockImplementation((action) => {
      if (action === initiateReturnValue) {
        return { unwrap: mockUnwrap }
      }
      return action
    })

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, search: '', pathname: '/welcome/spaces' },
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  it('should dispatch setAuthenticated when pending flag exists and session check succeeds', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'auth/setAuthenticated',
        payload: 1000000 + 24 * 60 * 60 * 1000,
      })
    })
  })

  it('should remove sessionStorage flag after successful processing', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(sessionStorage.getItem(OIDC_AUTH_PENDING_KEY)).toBeNull()
    })
  })

  it('should not dispatch when OIDC_AUTH feature is disabled', () => {
    mockUseHasFeature.mockReturnValue(false)
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')

    renderHook(() => useOidcLoginCallback())

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockInitiate).not.toHaveBeenCalled()
  })

  it('should not dispatch when no pending flag exists', () => {
    renderHook(() => useOidcLoginCallback())

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockInitiate).not.toHaveBeenCalled()
  })

  it('should not dispatch twice on re-render', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')

    const { rerender } = renderHook(() => useOidcLoginCallback())
    rerender()

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'auth/setAuthenticated',
        payload: expect.any(Number),
      })
    })
    expect(mockInitiate).toHaveBeenCalledTimes(1)
  })

  it('should show error notification when error query param is present', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        search: '?error=access_denied',
        pathname: '/welcome/spaces',
      },
    })

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'notifications/showNotification',
        payload: expect.objectContaining({
          variant: 'error',
          message: 'Something went wrong while signing in with email',
        }),
      })
    })
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/setAuthenticated' }))
    expect(mockInitiate).not.toHaveBeenCalled()
  })

  it('should clean error param from URL via Next.js router', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        search: '?error=access_denied',
        pathname: '/welcome/spaces',
      },
    })

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/welcome/spaces', query: {} }, undefined, {
        shallow: true,
      })
    })
  })

  it('should preserve other query params when cleaning error param', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        search: '?spaceId=42&error=access_denied',
        pathname: '/welcome/spaces',
      },
    })

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/welcome/spaces', query: { spaceId: '42' } }, undefined, {
        shallow: true,
      })
    })
  })

  it('should not dispatch setAuthenticated when session check fails', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    mockUnwrap.mockRejectedValue(new Error('Forbidden'))

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockInitiate).toHaveBeenCalled()
    })
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/setAuthenticated' }))
  })

  it('should show error notification when session check fails', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    mockUnwrap.mockRejectedValue(new Error('Forbidden'))

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'notifications/showNotification',
        payload: expect.objectContaining({
          variant: 'error',
          message: 'Something went wrong while signing in with email',
        }),
      })
    })
  })

  it('should dispatch setIsEmailLoginPending(true) then false on success', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/setIsEmailLoginPending', payload: true })
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/setIsEmailLoginPending', payload: false })
    })

    const calls = mockDispatch.mock.calls.map((c) => c[0])
    const pendingTrueIdx = calls.findIndex((c) => c?.type === 'auth/setIsEmailLoginPending' && c?.payload === true)
    const pendingFalseIdx = calls.findIndex((c) => c?.type === 'auth/setIsEmailLoginPending' && c?.payload === false)
    expect(pendingTrueIdx).toBeLessThan(pendingFalseIdx)
  })

  it('should dispatch setIsEmailLoginPending(false) on failure', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    mockUnwrap.mockRejectedValue(new Error('Forbidden'))

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/setIsEmailLoginPending', payload: false })
    })
  })

  it('should remove sessionStorage flag when session check fails', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    mockUnwrap.mockRejectedValue(new Error('Forbidden'))

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(sessionStorage.getItem(OIDC_AUTH_PENDING_KEY)).toBeNull()
    })
  })
})
