import { renderHook, waitFor } from '@/tests/test-utils'
import { useAuth0TokenExchange } from '../useAuth0TokenExchange'
import * as auth0Api from '../../store/auth0Api'
import * as authSlice from '@/store/authSlice'
import { logError } from '@/services/exceptions'
import * as notificationsSlice from '@/store/notificationsSlice'
import type { IdToken } from '@auth0/auth0-react'

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

describe('useAuth0TokenExchange', () => {
  let mockVerifyAuth0: jest.Mock
  let mockUnwrap: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()

    mockUnwrap = jest.fn().mockResolvedValue(undefined)
    mockVerifyAuth0 = jest.fn().mockReturnValue({ unwrap: mockUnwrap })

    jest
      .spyOn(auth0Api, 'useAuthVerifyV2Mutation')
      .mockReturnValue([mockVerifyAuth0, { isLoading: false, reset: jest.fn() }] as unknown as ReturnType<
        typeof auth0Api.useAuthVerifyV2Mutation
      >)

    jest.spyOn(authSlice, 'isAuthenticated').mockReturnValue(false)
  })

  it('should not exchange when Auth0 is not authenticated', () => {
    const getIdTokenClaims = jest.fn()

    renderHook(() => useAuth0TokenExchange(false, getIdTokenClaims))

    expect(getIdTokenClaims).not.toHaveBeenCalled()
    expect(mockVerifyAuth0).not.toHaveBeenCalled()
  })

  it('should not exchange when getIdTokenClaims is undefined', () => {
    renderHook(() => useAuth0TokenExchange(true, undefined))

    expect(mockVerifyAuth0).not.toHaveBeenCalled()
  })

  it('should not exchange when CGW session is already authenticated', () => {
    jest.spyOn(authSlice, 'isAuthenticated').mockReturnValue(true)
    const getIdTokenClaims = jest.fn()

    renderHook(() => useAuth0TokenExchange(true, getIdTokenClaims))

    expect(getIdTokenClaims).not.toHaveBeenCalled()
    expect(mockVerifyAuth0).not.toHaveBeenCalled()
  })

  it('should exchange id_token and set authenticated on success', async () => {
    const mockClaims = { __raw: 'test-id-token' } as IdToken

    const getIdTokenClaims = jest.fn().mockResolvedValue(mockClaims)

    renderHook(() => useAuth0TokenExchange(true, getIdTokenClaims))

    await waitFor(() => {
      expect(getIdTokenClaims).toHaveBeenCalled()
      expect(mockVerifyAuth0).toHaveBeenCalledWith({ id_token: 'test-id-token' })
      expect(mockUnwrap).toHaveBeenCalled()
    })
  })

  it('should not call verify when claims have no __raw', async () => {
    const getIdTokenClaims = jest.fn().mockResolvedValue({} as IdToken)

    renderHook(() => useAuth0TokenExchange(true, getIdTokenClaims))

    await waitFor(() => {
      expect(getIdTokenClaims).toHaveBeenCalled()
    })

    expect(mockVerifyAuth0).not.toHaveBeenCalled()
  })

  it('should not call verify when claims are undefined', async () => {
    const getIdTokenClaims = jest.fn().mockResolvedValue(undefined)

    renderHook(() => useAuth0TokenExchange(true, getIdTokenClaims))

    await waitFor(() => {
      expect(getIdTokenClaims).toHaveBeenCalled()
    })

    expect(mockVerifyAuth0).not.toHaveBeenCalled()
  })

  it('should log error and show notification on failure', async () => {
    const error = new Error('verify failed')
    mockUnwrap.mockRejectedValue(error)

    const mockClaims = { __raw: 'test-id-token' } as IdToken
    const getIdTokenClaims = jest.fn().mockResolvedValue(mockClaims)

    const showNotificationSpy = jest.spyOn(notificationsSlice, 'showNotification')

    renderHook(() => useAuth0TokenExchange(true, getIdTokenClaims))

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
    const mockClaims = { __raw: 'test-id-token' } as IdToken
    const getIdTokenClaims = jest.fn().mockResolvedValue(mockClaims)

    const { rerender } = renderHook(() => useAuth0TokenExchange(true, getIdTokenClaims))

    rerender()

    await waitFor(() => {
      expect(getIdTokenClaims).toHaveBeenCalledTimes(1)
    })
  })

  it('should skip verify when the id_token has not changed since last exchange', async () => {
    const mockClaims = { __raw: 'same-token' } as IdToken
    const getIdTokenClaims = jest.fn().mockResolvedValue(mockClaims)

    const { rerender } = renderHook(
      ({ authed, getClaims }: { authed: boolean; getClaims: typeof getIdTokenClaims }) =>
        useAuth0TokenExchange(authed, getClaims),
      { initialProps: { authed: true, getClaims: getIdTokenClaims } },
    )

    // Wait for the first exchange to complete
    await waitFor(() => {
      expect(mockVerifyAuth0).toHaveBeenCalledTimes(1)
    })

    // Simulate CGW session expiring so the hook can attempt exchange again
    jest.spyOn(authSlice, 'isAuthenticated').mockReturnValue(false)

    // Provide a new function reference that still returns the same token
    const newGetIdTokenClaims = jest.fn().mockResolvedValue(mockClaims)
    rerender({ authed: true, getClaims: newGetIdTokenClaims })

    await waitFor(() => {
      expect(newGetIdTokenClaims).toHaveBeenCalled()
    })

    // verify should still only have been called once — same token, no extra call
    expect(mockVerifyAuth0).toHaveBeenCalledTimes(1)
  })

  it('should exchange again when the id_token changes', async () => {
    const firstClaims = { __raw: 'token-1' } as IdToken
    const getIdTokenClaims = jest.fn().mockResolvedValue(firstClaims)

    const { rerender } = renderHook(
      ({ authed, getClaims }: { authed: boolean; getClaims: typeof getIdTokenClaims }) =>
        useAuth0TokenExchange(authed, getClaims),
      { initialProps: { authed: true, getClaims: getIdTokenClaims } },
    )

    // Wait for first exchange
    await waitFor(() => {
      expect(mockVerifyAuth0).toHaveBeenCalledWith({ id_token: 'token-1' })
    })

    // Simulate CGW session expiring
    jest.spyOn(authSlice, 'isAuthenticated').mockReturnValue(false)

    // Provide a new function reference that returns a different token
    const secondClaims = { __raw: 'token-2' } as IdToken
    const newGetIdTokenClaims = jest.fn().mockResolvedValue(secondClaims)
    rerender({ authed: true, getClaims: newGetIdTokenClaims })

    await waitFor(() => {
      expect(mockVerifyAuth0).toHaveBeenCalledWith({ id_token: 'token-2' })
    })

    expect(mockVerifyAuth0).toHaveBeenCalledTimes(2)
  })

  it('should use fallback error message for non-Error exceptions', async () => {
    mockUnwrap.mockRejectedValue('string-error')

    const mockClaims = { __raw: 'test-id-token' } as IdToken
    const getIdTokenClaims = jest.fn().mockResolvedValue(mockClaims)

    renderHook(() => useAuth0TokenExchange(true, getIdTokenClaims))

    await waitFor(() => {
      expect(logError).toHaveBeenCalledWith(expect.any(String), 'Auth0 token exchange failed')
    })
  })
})
