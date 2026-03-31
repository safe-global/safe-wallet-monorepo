import { renderHook, waitFor } from '@testing-library/react'
import { useOidcLoginCallback } from '../useOidcLoginCallback'
import { OIDC_AUTH_PENDING_KEY } from '../../constants'

const mockReplace = jest.fn()
const mockReconcileAuth = jest.fn()

jest.mock('@/store/reconcileAuth', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockReconcileAuth(...args),
}))

const mockDispatch = jest.fn((action) => action)

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/authSlice', () => ({
  setIsOidcLoginPending: (pending: boolean) => ({ type: 'auth/setIsOidcLoginPending', payload: pending }),
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

  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()

    mockUseHasFeature.mockReturnValue(true)
    mockReconcileAuth.mockResolvedValue('authenticated')

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, search: '', pathname: '/welcome/spaces' },
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  it('should call reconcileAuth when pending flag exists', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockReconcileAuth).toHaveBeenCalledWith(mockDispatch)
    })
  })

  it('should remove sessionStorage flag after successful processing', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(sessionStorage.getItem(OIDC_AUTH_PENDING_KEY)).toBeNull()
    })
  })

  it('should not process when OIDC_AUTH feature is disabled', () => {
    mockUseHasFeature.mockReturnValue(false)
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')

    renderHook(() => useOidcLoginCallback())

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockReconcileAuth).not.toHaveBeenCalled()
  })

  it('should not process when no pending flag exists', () => {
    renderHook(() => useOidcLoginCallback())

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockReconcileAuth).not.toHaveBeenCalled()
  })

  it('should not process twice on re-render', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')

    const { rerender } = renderHook(() => useOidcLoginCallback())
    rerender()

    await waitFor(() => {
      expect(mockReconcileAuth).toHaveBeenCalledTimes(1)
    })
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
    expect(mockReconcileAuth).not.toHaveBeenCalled()
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

  it('should show error notification when reconcileAuth returns unauthenticated', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    mockReconcileAuth.mockResolvedValue('unauthenticated')

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

  it('should not show error notification when reconcileAuth succeeds', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    mockReconcileAuth.mockResolvedValue('authenticated')

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockReconcileAuth).toHaveBeenCalled()
    })
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'notifications/showNotification' }))
  })

  it('should dispatch setIsOidcLoginPending(true) then false', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/setIsOidcLoginPending', payload: true })
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/setIsOidcLoginPending', payload: false })
    })

    const calls = mockDispatch.mock.calls.map((c) => c[0])
    const pendingTrueIdx = calls.findIndex((c) => c?.type === 'auth/setIsOidcLoginPending' && c?.payload === true)
    const pendingFalseIdx = calls.findIndex((c) => c?.type === 'auth/setIsOidcLoginPending' && c?.payload === false)
    expect(pendingTrueIdx).toBeLessThan(pendingFalseIdx)
  })

  it('should dispatch setIsOidcLoginPending(false) on failure', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    mockReconcileAuth.mockResolvedValue('unauthenticated')

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/setIsOidcLoginPending', payload: false })
    })
  })

  it('should remove sessionStorage flag when reconcileAuth returns unauthenticated', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    mockReconcileAuth.mockResolvedValue('unauthenticated')

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(sessionStorage.getItem(OIDC_AUTH_PENDING_KEY)).toBeNull()
    })
  })

  it('should not show error notification on transient errors', async () => {
    sessionStorage.setItem(OIDC_AUTH_PENDING_KEY, '1')
    mockReconcileAuth.mockResolvedValue('error')

    renderHook(() => useOidcLoginCallback())

    await waitFor(() => {
      expect(mockReconcileAuth).toHaveBeenCalled()
      expect(sessionStorage.getItem(OIDC_AUTH_PENDING_KEY)).toBeNull()
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'auth/setIsOidcLoginPending', payload: false })
    })
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'notifications/showNotification' }))
  })
})
