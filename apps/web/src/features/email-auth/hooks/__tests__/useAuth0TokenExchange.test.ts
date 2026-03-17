import { renderHook, waitFor } from '@/tests/test-utils'
import { useAuth0TokenExchange } from '../useAuth0TokenExchange'
import * as authApi from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import * as authSlice from '@/store/authSlice'
import { logError } from '@/services/exceptions'
import * as notificationsSlice from '@/store/notificationsSlice'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

describe('useAuth0TokenExchange', () => {
  let mockVerifyAuth: jest.Mock
  let mockUnwrap: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    mockUnwrap = jest.fn().mockResolvedValue(undefined)
    mockVerifyAuth = jest.fn().mockReturnValue({ unwrap: mockUnwrap })

    jest
      .spyOn(authApi, 'useAuthVerifyV1Mutation')
      .mockReturnValue([mockVerifyAuth, { isLoading: false, reset: jest.fn() }] as unknown as ReturnType<
        typeof authApi.useAuthVerifyV1Mutation
      >)

    jest.spyOn(authSlice, 'isAuthenticated').mockReturnValue(false)
  })

  it('should not exchange when Auth0 is not authenticated', () => {
    const getAccessToken = jest.fn()

    renderHook(() => useAuth0TokenExchange(false, getAccessToken))

    expect(getAccessToken).not.toHaveBeenCalled()
    expect(mockVerifyAuth).not.toHaveBeenCalled()
  })

  it('should not exchange when getAccessToken is undefined', () => {
    renderHook(() => useAuth0TokenExchange(true, undefined))

    expect(mockVerifyAuth).not.toHaveBeenCalled()
  })

  it('should not exchange when CGW session is already authenticated', () => {
    jest.spyOn(authSlice, 'isAuthenticated').mockReturnValue(true)
    const getAccessToken = jest.fn()

    renderHook(() => useAuth0TokenExchange(true, getAccessToken))

    expect(getAccessToken).not.toHaveBeenCalled()
    expect(mockVerifyAuth).not.toHaveBeenCalled()
  })

  it('should exchange access token and set authenticated on success', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('test-access-token')

    renderHook(() => useAuth0TokenExchange(true, getAccessToken))

    await waitFor(() => {
      expect(getAccessToken).toHaveBeenCalled()
      expect(mockVerifyAuth).toHaveBeenCalledWith({ body: { access_token: 'test-access-token' } })
      expect(mockUnwrap).toHaveBeenCalled()
    })
  })

  it('should not call verify when access token is empty', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('')

    renderHook(() => useAuth0TokenExchange(true, getAccessToken))

    await waitFor(() => {
      expect(getAccessToken).toHaveBeenCalled()
    })

    expect(mockVerifyAuth).not.toHaveBeenCalled()
  })

  it('should log error and show notification on failure', async () => {
    const error = new Error('verify failed')
    mockUnwrap.mockRejectedValue(error)

    const getAccessToken = jest.fn().mockResolvedValue('test-access-token')

    const showNotificationSpy = jest.spyOn(notificationsSlice, 'showNotification')

    renderHook(() => useAuth0TokenExchange(true, getAccessToken))

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(expect.any(String), 'verify failed')
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Something went wrong while signing in with email',
          variant: 'error',
          groupKey: 'email-sign-in-failed',
        }),
      )
    })
  })

  it('should not exchange twice on concurrent renders', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('test-access-token')

    const { rerender } = renderHook(() => useAuth0TokenExchange(true, getAccessToken))

    rerender()

    await waitFor(() => {
      expect(getAccessToken).toHaveBeenCalledTimes(1)
    })
  })

  it('should skip verify when the access token has not changed since last exchange', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('same-token')

    const { rerender } = renderHook(
      ({ authed, getToken }: { authed: boolean; getToken: typeof getAccessToken }) =>
        useAuth0TokenExchange(authed, getToken),
      { initialProps: { authed: true, getToken: getAccessToken } },
    )

    // Wait for the first exchange to complete
    await waitFor(() => {
      expect(mockVerifyAuth).toHaveBeenCalledTimes(1)
    })

    // Simulate CGW session expiring so the hook can attempt exchange again
    jest.spyOn(authSlice, 'isAuthenticated').mockReturnValue(false)

    // Provide a new function reference that still returns the same token
    const newGetAccessToken = jest.fn().mockResolvedValue('same-token')
    rerender({ authed: true, getToken: newGetAccessToken })

    await waitFor(() => {
      expect(newGetAccessToken).toHaveBeenCalled()
    })

    // verify should still only have been called once — same token, no extra call
    expect(mockVerifyAuth).toHaveBeenCalledTimes(1)
  })

  it('should exchange again when the access token changes', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('token-1')

    const { rerender } = renderHook(
      ({ authed, getToken }: { authed: boolean; getToken: typeof getAccessToken }) =>
        useAuth0TokenExchange(authed, getToken),
      { initialProps: { authed: true, getToken: getAccessToken } },
    )

    // Wait for first exchange
    await waitFor(() => {
      expect(mockVerifyAuth).toHaveBeenCalledWith({ body: { access_token: 'token-1' } })
    })

    // Simulate CGW session expiring
    jest.spyOn(authSlice, 'isAuthenticated').mockReturnValue(false)

    // Provide a new function reference that returns a different token
    const newGetAccessToken = jest.fn().mockResolvedValue('token-2')
    rerender({ authed: true, getToken: newGetAccessToken })

    await waitFor(() => {
      expect(mockVerifyAuth).toHaveBeenCalledWith({ body: { access_token: 'token-2' } })
    })

    expect(mockVerifyAuth).toHaveBeenCalledTimes(2)
  })

  it('should use fallback error message for non-Error exceptions', async () => {
    mockUnwrap.mockRejectedValue('string-error')

    const getAccessToken = jest.fn().mockResolvedValue('test-access-token')

    renderHook(() => useAuth0TokenExchange(true, getAccessToken))

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(expect.any(String), 'Auth0 token exchange failed')
    })
  })
})
