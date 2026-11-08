import { faker } from '@faker-js/faker'
import { act, waitFor } from '@testing-library/react'
import { renderHook } from '@/tests/test-utils'
import { clearAuthCookie, getAuthCookieToken, setAuthCookie } from '../../store/cookieStorage'
import { hnSessionSlice } from '../../store/hnSessionSlice'
import { useHypernativeOAuth } from '../useHypernativeOAuth'

const signIn = (): string => {
  setAuthCookie({ access_token: faker.string.alphanumeric(40), token_type: 'Bearer', expires_in: 3600 })
  return getAuthCookieToken() as string
}

const unknownToken = () => `Bearer ${faker.string.alphanumeric(40)}`

const withRejectedToken = (rejectedToken: string) => ({
  initialReduxState: { [hnSessionSlice.name]: { rejectedToken } },
})

describe('useHypernativeOAuth when the API rejected the session', () => {
  afterEach(() => clearAuthCookie())

  it('reports a signed-in session as authenticated and not rejected', () => {
    signIn()

    const { result } = renderHook(() => useHypernativeOAuth())

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isSessionRejected).toBe(false)
  })

  it('reports the rejected token as signed out while its cookie is still present', () => {
    const rejectedToken = signIn()

    const { result } = renderHook(() => useHypernativeOAuth(), withRejectedToken(rejectedToken))

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isSessionRejected).toBe(true)
  })

  it('keeps the session rejected once the rejected cookie is gone', () => {
    const { result } = renderHook(() => useHypernativeOAuth(), withRejectedToken(unknownToken()))

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isSessionRejected).toBe(true)
  })

  it('signs in with a new token and logs out of it as a regular session', async () => {
    signIn()

    const { result } = renderHook(() => useHypernativeOAuth(), withRejectedToken(unknownToken()))
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true))
    act(() => result.current.logout())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isSessionRejected).toBe(false)
  })

  it('forgets the rejection on logout', () => {
    const { result } = renderHook(() => useHypernativeOAuth(), withRejectedToken(unknownToken()))

    act(() => result.current.logout())

    expect(result.current.isSessionRejected).toBe(false)
  })
})
