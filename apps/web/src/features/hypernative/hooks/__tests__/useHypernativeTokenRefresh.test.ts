import { act, renderHook } from '@testing-library/react'
import { getAuthCookieData, setAuthCookie } from '../../store/cookieStorage'
import { useHypernativeTokenRefresh } from '../useHypernativeTokenRefresh'

const mockCookieJar = new Map<string, string>()

jest.mock('js-cookie', () => ({
  get: (key: string) => mockCookieJar.get(key),
  set: (key: string, value: string) => mockCookieJar.set(key, value),
  remove: (key: string) => mockCookieJar.delete(key),
}))

const mockExchange = jest.fn()

jest.mock('@safe-global/store/hypernative/hypernativeApi', () => {
  const trigger = (request: unknown) => ({ unwrap: () => mockExchange(request) })
  return { hypernativeApi: { useExchangeTokenMutation: () => [trigger] } }
})

const REFRESH_WINDOW_SECONDS = 2592000

const tokensFor = (generation: number, expiresIn = 300) => ({
  access_token: `access-${generation}`,
  token_type: 'Bearer',
  expires_in: expiresIn,
  refresh_token: `refresh-${generation}`,
  refresh_expires_in: REFRESH_WINDOW_SECONDS,
})

const refreshRequest = (refreshToken: string) => ({
  grant_type: 'refresh_token',
  client_id: expect.any(String),
  refresh_token: refreshToken,
})

const advance = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms))

const setOnline = (isOnline: boolean) =>
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: isOnline })

describe('useHypernativeTokenRefresh', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockCookieJar.clear()
    mockExchange.mockReset()
    mockExchange.mockResolvedValue(tokensFor(2))
    setOnline(true)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('does nothing for a session without a refresh token', async () => {
    setAuthCookie({ access_token: 'access-1', token_type: 'Bearer', expires_in: 30 })

    renderHook(() => useHypernativeTokenRefresh())
    await advance(10 * 60_000)

    expect(mockExchange).not.toHaveBeenCalled()
  })

  it('refreshes one minute before the access token expires', async () => {
    setAuthCookie(tokensFor(1, 300))

    renderHook(() => useHypernativeTokenRefresh())
    await advance(240_000 - 1)
    expect(mockExchange).not.toHaveBeenCalled()

    await advance(1)
    expect(mockExchange).toHaveBeenCalledWith(refreshRequest('refresh-1'))
    expect(getAuthCookieData()).toMatchObject({ token: 'access-2', refreshToken: 'refresh-2' })
  })

  it('refreshes at once when the access token is already inside the margin', async () => {
    setAuthCookie(tokensFor(1, 30))

    renderHook(() => useHypernativeTokenRefresh())
    await advance(0)

    expect(mockExchange).toHaveBeenCalledWith(refreshRequest('refresh-1'))
  })

  it('schedules the next refresh for the rotated token', async () => {
    setAuthCookie(tokensFor(1, 30))
    mockExchange.mockResolvedValueOnce(tokensFor(2, 300)).mockResolvedValueOnce(tokensFor(3, 300))

    renderHook(() => useHypernativeTokenRefresh())
    await advance(0)
    await advance(240_000)

    expect(mockExchange).toHaveBeenCalledTimes(2)
    expect(mockExchange).toHaveBeenLastCalledWith(refreshRequest('refresh-2'))
  })

  it('starts after a sign-in in this tab', async () => {
    renderHook(() => useHypernativeTokenRefresh())

    act(() => setAuthCookie(tokensFor(1, 30)))
    await advance(0)

    expect(mockExchange).toHaveBeenCalledWith(refreshRequest('refresh-1'))
  })

  it('signs out when the server rejects the refresh chain', async () => {
    mockExchange.mockRejectedValue({ success: false, data: null, error: { error: 'invalid_grant' } })
    setAuthCookie(tokensFor(1, 30))

    renderHook(() => useHypernativeTokenRefresh())
    await advance(60_000)

    expect(mockExchange).toHaveBeenCalledTimes(1)
    expect(getAuthCookieData()).toBeUndefined()
  })

  it('keeps the session when a retry succeeds', async () => {
    mockExchange.mockRejectedValueOnce({ message: 'Rejected' })
    setAuthCookie(tokensFor(1, 30))

    renderHook(() => useHypernativeTokenRefresh())
    await advance(0)
    await advance(1_000)

    expect(mockExchange).toHaveBeenCalledTimes(2)
    expect(getAuthCookieData()).toMatchObject({ refreshToken: 'refresh-2' })
  })

  it('retries after 1, 2, 4 and 8 seconds, then never sends the token again', async () => {
    mockExchange.mockRejectedValue({ message: 'Rejected' })
    setAuthCookie(tokensFor(1, 30))

    renderHook(() => useHypernativeTokenRefresh())
    await advance(0)
    expect(mockExchange).toHaveBeenCalledTimes(1)

    for (const [index, delayMs] of [1_000, 2_000, 4_000, 8_000].entries()) {
      await advance(delayMs - 1)
      expect(mockExchange).toHaveBeenCalledTimes(index + 1)
      await advance(1)
      expect(mockExchange).toHaveBeenCalledTimes(index + 2)
    }

    expect(getAuthCookieData()).toMatchObject({ token: 'access-1', refreshAbandoned: true })

    act(() => window.dispatchEvent(new Event('online')))
    await advance(60_000)
    expect(mockExchange).toHaveBeenCalledTimes(5)
  })

  it('does not restart the retries when the window gets focus during a retry', async () => {
    mockExchange.mockRejectedValue({ message: 'Rejected' })
    setAuthCookie(tokensFor(1, 30))

    renderHook(() => useHypernativeTokenRefresh())
    await advance(0)
    act(() => window.dispatchEvent(new Event('focus')))
    await advance(999)

    expect(mockExchange).toHaveBeenCalledTimes(1)
  })

  it('keeps a token whose retries ran out offline and sends it again when the browser is online', async () => {
    setOnline(false)
    mockExchange.mockRejectedValue({ message: 'Rejected' })
    setAuthCookie(tokensFor(1, 30))

    renderHook(() => useHypernativeTokenRefresh())
    await advance(15_000)
    expect(mockExchange).toHaveBeenCalledTimes(5)
    expect(getAuthCookieData()?.refreshAbandoned).toBeUndefined()

    await advance(5_000)
    expect(mockExchange).toHaveBeenCalledTimes(5)

    setOnline(true)
    mockExchange.mockResolvedValue(tokensFor(2))
    act(() => window.dispatchEvent(new Event('online')))
    await advance(0)

    expect(mockExchange).toHaveBeenCalledTimes(6)
    expect(getAuthCookieData()).toMatchObject({ refreshToken: 'refresh-2' })
  })

  it.each([
    [
      'the page becomes visible',
      () => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
        document.dispatchEvent(new Event('visibilitychange'))
      },
    ],
    ['the window gets focus', () => window.dispatchEvent(new Event('focus'))],
  ])('checks again when %s after the device slept', async (_label, wake) => {
    setAuthCookie(tokensFor(1, 300))
    renderHook(() => useHypernativeTokenRefresh())

    // A sleeping device moves the clock forward without firing the pending timer
    jest.setSystemTime(Date.now() + 250_000)
    act(wake)
    await advance(0)

    expect(mockExchange).toHaveBeenCalledWith(refreshRequest('refresh-1'))
  })

  it('follows a token that another tab rotated', async () => {
    setAuthCookie(tokensFor(1, 300))
    renderHook(() => useHypernativeTokenRefresh())

    mockCookieJar.set(
      'hn_auth',
      JSON.stringify({
        token: 'access-9',
        tokenType: 'Bearer',
        expiry: Date.now() + 600_000,
        refreshToken: 'refresh-9',
        refreshExpiry: Date.now() + REFRESH_WINDOW_SECONDS * 1000,
      }),
    )
    await advance(240_000)
    expect(mockExchange).not.toHaveBeenCalled()

    await advance(300_000)
    expect(mockExchange).toHaveBeenCalledWith(refreshRequest('refresh-9'))
  })

  it('stops on unmount', async () => {
    setAuthCookie(tokensFor(1, 300))

    const { unmount } = renderHook(() => useHypernativeTokenRefresh())
    unmount()
    await advance(10 * 60_000)

    expect(mockExchange).not.toHaveBeenCalled()
  })
})
