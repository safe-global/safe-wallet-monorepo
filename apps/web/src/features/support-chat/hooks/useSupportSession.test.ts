import { faker } from '@faker-js/faker'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { type SupportSession, useSupportSession } from './useSupportSession'

describe('useSupportSession', () => {
  const gatewayUrl = 'https://support-gateway.test'
  const originalFetch = global.fetch
  const mockFetch = jest.fn()
  let session: SupportSession

  beforeEach(() => {
    jest.useFakeTimers()
    mockFetch.mockReset()
    global.fetch = mockFetch
    session = {
      appId: faker.string.uuid(),
      email: faker.internet.email(),
      jwt: faker.string.alphanumeric(64),
      expiresAt: Math.floor(Date.now() / 1000) + 600,
      supportEligible: true,
    }
    mockFetch.mockResolvedValue({ ok: true, json: async () => session })
  })

  afterEach(() => {
    jest.useRealTimers()
    global.fetch = originalFetch
  })

  it('loads a session directly and does not poll availability', async () => {
    const { result, unmount } = renderHook(() => useSupportSession(gatewayUrl, true, 'user'))
    await waitFor(() => expect(result.current.session).toEqual(session))
    expect(mockFetch).toHaveBeenCalledWith(
      `${gatewayUrl}/v1/support/session`,
      expect.objectContaining({ method: 'POST', credentials: 'include', cache: 'no-store' }),
    )
    await act(async () => jest.advanceTimersByTime(6000))
    expect(mockFetch).toHaveBeenCalledTimes(1)
    unmount()
    expect(mockFetch.mock.calls[0][1].signal.aborted).toBe(true)
    await act(async () => jest.advanceTimersByTime(600000))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('discards an extra HMAC field from an authenticated JWT session', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ...session, emailHash: faker.string.hexadecimal({ length: 64 }) }),
    })
    const { result } = renderHook(() => useSupportSession(gatewayUrl, true, 'user'))
    await waitFor(() => expect(result.current.session).toEqual(session))
  })

  it('fetches eligibility once per opening without refreshing even after token expiry', async () => {
    const { result, rerender } = renderHook(
      ({ open }) => useSupportSession(gatewayUrl, open, 'user', { autoRefresh: false }),
      { initialProps: { open: true } },
    )
    await waitFor(() => expect(result.current.session?.supportEligible).toBe(true))
    await act(async () => jest.advanceTimersByTime(60 * 60_000))
    expect(mockFetch).toHaveBeenCalledTimes(1)
    rerender({ open: false })
    expect(result.current.session).toBeUndefined()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ...session, supportEligible: false, expiresAt: Math.floor(Date.now() / 1000) + 600 }),
    })
    rerender({ open: true })
    await waitFor(() => expect(result.current.session?.supportEligible).toBe(false))
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it.each([
    { open: false, identityKey: 'user' },
    { open: true, identityKey: undefined },
  ])('does not request a session for %j', async ({ open, identityKey }) => {
    const { result } = renderHook(() => useSupportSession(gatewayUrl, open, identityKey))
    await act(async () => jest.advanceTimersByTime(6000))
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.session).toBeUndefined()
  })

  it('clears the identity and cancels refresh when closed', async () => {
    const { result, rerender } = renderHook(({ open }) => useSupportSession(gatewayUrl, open, 'user'), {
      initialProps: { open: true },
    })
    await waitFor(() => expect(result.current.session).toEqual(session))
    rerender({ open: false })
    expect(result.current.session).toBeUndefined()
    expect(mockFetch.mock.calls[0][1].signal.aborted).toBe(true)
    await act(async () => jest.advanceTimersByTime(600000))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('ignores a late response from the previous user', async () => {
    let resolveFirst!: (response: { ok: boolean; json: () => Promise<SupportSession> }) => void
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve
        }),
    )
    const { result, rerender } = renderHook(({ identityKey }) => useSupportSession(gatewayUrl, true, identityKey), {
      initialProps: { identityKey: 'first-user' },
    })
    rerender({ identityKey: 'second-user' })
    expect(mockFetch.mock.calls[0][1].signal.aborted).toBe(true)
    await waitFor(() => expect(result.current.session).toEqual(session))
    await act(async () => {
      resolveFirst({ ok: true, json: async () => ({ ...session, email: faker.internet.email() }) })
    })
    expect(result.current.session).toEqual(session)
  })

  it('reports an unavailable backend without exposing a session', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404 })
    const { result } = renderHook(() => useSupportSession(gatewayUrl, true, 'user'))
    await waitFor(() => expect(result.current.error).toBeDefined())
    expect(result.current.session).toBeUndefined()
  })
  it('backs off failed refreshes to five minutes, preserves the frame identity and resets on recovery', async () => {
    const { result } = renderHook(() => useSupportSession(gatewayUrl, true, 'user'))
    await waitFor(() => expect(result.current.session).toEqual(session))
    mockFetch.mockRejectedValue(new Error('Offline'))
    await act(async () => jest.advanceTimersByTime(session.expiresAt * 1000 - Date.now() - 30000))
    expect(mockFetch).toHaveBeenCalledTimes(2)
    for (const delay of [30000, 60000, 120000, 240000, 300000, 300000]) {
      const calls = mockFetch.mock.calls.length
      await act(async () => jest.advanceTimersByTime(delay - 1))
      expect(mockFetch).toHaveBeenCalledTimes(calls)
      await act(async () => jest.advanceTimersByTime(1))
      expect(mockFetch).toHaveBeenCalledTimes(calls + 1)
      expect(result.current.session).toEqual(session)
    }
    const recovered = { ...session, expiresAt: Math.floor(Date.now() / 1000) + 900 }
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => recovered })
    await act(async () => jest.advanceTimersByTime(300000))
    expect(result.current.error).toBeUndefined()
    expect(result.current.session).toEqual(recovered)
    await act(async () => jest.advanceTimersByTime(recovered.expiresAt * 1000 - Date.now() - 30000))
    const calls = mockFetch.mock.calls.length
    await act(async () => jest.advanceTimersByTime(29999))
    expect(mockFetch).toHaveBeenCalledTimes(calls)
    await act(async () => jest.advanceTimersByTime(1))
    expect(mockFetch).toHaveBeenCalledTimes(calls + 1)
  })

  it('manual retry bypasses backoff, clears the old identity and cancels its pending timer', async () => {
    const { result, unmount } = renderHook(() => useSupportSession(gatewayUrl, true, 'user'))
    await waitFor(() => expect(result.current.session).toEqual(session))
    mockFetch.mockRejectedValue(new Error('Offline'))
    await act(async () => jest.advanceTimersByTime(session.expiresAt * 1000 - Date.now() - 30000))
    await act(async () => jest.advanceTimersByTime(30000))
    await act(async () => jest.advanceTimersByTime(60000))
    const calls = mockFetch.mock.calls.length
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...session, expiresAt: Math.floor(Date.now() / 1000) + 600 }),
    })
    await act(async () => result.current.retry())
    expect(mockFetch).toHaveBeenCalledTimes(calls + 1)
    expect(result.current.error).toBeUndefined()
    await act(async () => jest.advanceTimersByTime(120000))
    expect(mockFetch).toHaveBeenCalledTimes(calls + 1)
    unmount()
    await act(async () => jest.advanceTimersByTime(600000))
    expect(mockFetch).toHaveBeenCalledTimes(calls + 1)
  })

  it.each([401, 403, 404])('stops retrying and drops the session when refresh returns %s', async (status) => {
    const { result } = renderHook(() => useSupportSession(gatewayUrl, true, 'user'))
    await waitFor(() => expect(result.current.session).toEqual(session))
    mockFetch.mockRejectedValueOnce(new Error('Offline'))
    await act(async () => jest.advanceTimersByTime(session.expiresAt * 1000 - Date.now() - 30000))
    mockFetch.mockResolvedValueOnce({ ok: false, status })
    await act(async () => jest.advanceTimersByTime(30000))
    expect(result.current.session).toBeUndefined()
    expect(result.current.error).toBe(
      status === 404 ? 'Support is unavailable. Please try again later.' : 'Please sign in again to access support.',
    )
    await act(async () => jest.advanceTimersByTime(600000))
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('does not start background retries for a failed badge request', async () => {
    mockFetch.mockRejectedValue(new Error('Offline'))
    const { result } = renderHook(() => useSupportSession(gatewayUrl, true, 'user', { autoRefresh: false }))
    await waitFor(() => expect(result.current.error).toBeDefined())
    await act(async () => jest.advanceTimersByTime(3600000))
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
