import { renderHook, waitFor } from '@testing-library/react'
import { useEmailLoginCallback } from '../useEmailLoginCallback'
import { EMAIL_AUTH_PENDING_KEY } from '../useEmailLogin'

const mockDispatch = jest.fn()
const mockReplace = jest.fn()
const mockCheckSession = jest.fn()
const mockUnwrap = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  useLazyAuthGetMeV1Query: () => [mockCheckSession],
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/authSlice', () => ({
  setAuthenticated: (expiresAt: number) => ({ type: 'auth/setAuthenticated', payload: expiresAt }),
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

describe('useEmailLoginCallback', () => {
  const originalLocation = window.location

  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    
    jest.spyOn(Date, 'now').mockReturnValue(1000000)

    mockUnwrap.mockResolvedValue(undefined)
    mockCheckSession.mockReturnValue({ unwrap: mockUnwrap })

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
    sessionStorage.setItem(EMAIL_AUTH_PENDING_KEY, '1')

    renderHook(() => useEmailLoginCallback())

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'auth/setAuthenticated',
        payload: 1000000 + 24 * 60 * 60 * 1000,
      })
    })
  })

  it('should remove sessionStorage flag after successful processing', async () => {
    sessionStorage.setItem(EMAIL_AUTH_PENDING_KEY, '1')

    renderHook(() => useEmailLoginCallback())

    await waitFor(() => {
      expect(sessionStorage.getItem(EMAIL_AUTH_PENDING_KEY)).toBeNull()
    })
  })

  it('should not dispatch when no pending flag exists', () => {
    renderHook(() => useEmailLoginCallback())

    expect(mockDispatch).not.toHaveBeenCalled()
    expect(mockCheckSession).not.toHaveBeenCalled()
  })

  it('should not dispatch twice on re-render', async () => {
    sessionStorage.setItem(EMAIL_AUTH_PENDING_KEY, '1')

    const { rerender } = renderHook(() => useEmailLoginCallback())
    rerender()

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledTimes(1)
    })
    expect(mockCheckSession).toHaveBeenCalledTimes(1)
  })

  it('should show error notification when error query param is present', async () => {
    sessionStorage.setItem(EMAIL_AUTH_PENDING_KEY, '1')
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        search: '?error=access_denied',
        pathname: '/welcome/spaces',
      },
    })

    renderHook(() => useEmailLoginCallback())

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
    expect(mockCheckSession).not.toHaveBeenCalled()
  })

  it('should clean error param from URL via Next.js router', async () => {
    sessionStorage.setItem(EMAIL_AUTH_PENDING_KEY, '1')
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        ...originalLocation,
        search: '?error=access_denied',
        pathname: '/welcome/spaces',
      },
    })

    renderHook(() => useEmailLoginCallback())

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/welcome/spaces', query: {} }, undefined, {
        shallow: true,
      })
    })
  })

  it('should not dispatch setAuthenticated when session check fails', async () => {
    sessionStorage.setItem(EMAIL_AUTH_PENDING_KEY, '1')
    mockUnwrap.mockRejectedValue(new Error('Forbidden'))

    renderHook(() => useEmailLoginCallback())

    await waitFor(() => {
      expect(mockCheckSession).toHaveBeenCalled()
    })
    expect(mockDispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'auth/setAuthenticated' }))
  })

  it('should remove sessionStorage flag when session check fails', async () => {
    sessionStorage.setItem(EMAIL_AUTH_PENDING_KEY, '1')
    mockUnwrap.mockRejectedValue(new Error('Forbidden'))

    renderHook(() => useEmailLoginCallback())

    await waitFor(() => {
      expect(sessionStorage.getItem(EMAIL_AUTH_PENDING_KEY)).toBeNull()
    })
  })
})
