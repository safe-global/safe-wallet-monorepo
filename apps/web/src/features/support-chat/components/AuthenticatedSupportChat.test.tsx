import { faker } from '@faker-js/faker'
import { act, fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import type { SupportSession } from '../hooks/useSupportSession'
import AuthenticatedSupportChat from './AuthenticatedSupportChat'

const props = {
  gatewayUrl: 'https://support-gateway.test',
  chatUrl: 'https://support.test/chat',
  identityKey: 'user',
  open: true,
  onClose: jest.fn(),
}

describe('AuthenticatedSupportChat', () => {
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
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => session })
  })

  afterEach(() => {
    jest.useRealTimers()
    global.fetch = originalFetch
  })

  async function readyFrame() {
    const frame = (await screen.findByTitle('Safe Support Chat')) as HTMLIFrameElement
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'https://support.test',
          source: frame.contentWindow,
          data: { type: 'pylon-chat-ready' },
        }),
      )
    })
    return frame
  }

  it('keeps the same iframe while refreshing and after receiving a new token', async () => {
    render(<AuthenticatedSupportChat {...props} />)
    const frame = await readyFrame()
    let resolveRefresh!: (response: { ok: boolean; json: () => Promise<SupportSession> }) => void
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve
        }),
    )
    await act(async () => {
      jest.advanceTimersByTime(session.expiresAt * 1000 - Date.now() - 30000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(screen.getByTitle('Safe Support Chat')).toBe(frame)
    const refreshed = { ...session, jwt: faker.string.alphanumeric(64), expiresAt: session.expiresAt + 600 }
    await act(async () => {
      resolveRefresh({ ok: true, json: async () => refreshed })
    })
    expect(screen.getByTitle('Safe Support Chat')).toBe(frame)
    mockFetch.mockRejectedValueOnce(new Error('Offline'))
    await act(async () => {
      jest.advanceTimersByTime(refreshed.expiresAt * 1000 - Date.now() - 30000)
    })
    expect(mockFetch).toHaveBeenCalledTimes(3)
    expect(screen.getByTitle('Safe Support Chat')).toBe(frame)
  })

  it('removes the open iframe and stops refreshes when the gateway returns 404', async () => {
    render(<AuthenticatedSupportChat {...props} />)
    await readyFrame()
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
    await act(async () => jest.advanceTimersByTime(session.expiresAt * 1000 - Date.now() - 30000))
    expect(screen.queryByTitle('Safe Support Chat')).not.toBeInTheDocument()
    expect(screen.getByText('Support is unavailable. Please try again later.')).toBeInTheDocument()
    await act(async () => jest.advanceTimersByTime(600000))
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('times out a stalled identity request and lets the user retry', async () => {
    mockFetch.mockImplementationOnce(
      (_url: string, { signal }: RequestInit) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })
        }),
    )
    render(<AuthenticatedSupportChat {...props} />)
    expect(screen.getByLabelText('Loading support')).toBeInTheDocument()
    await act(async () => {
      jest.advanceTimersByTime(20000)
    })
    expect(screen.getByText('Support did not respond. Please try again.')).toBeInTheDocument()
    expect(mockFetch.mock.calls[0][1].signal.aborted).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.getByTitle('Safe Support Chat')).toBeInTheDocument())
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('replaces the iframe when refresh selects a different widget', async () => {
    render(<AuthenticatedSupportChat {...props} />)
    const frame = await readyFrame()
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...session, appId: faker.string.uuid(), expiresAt: session.expiresAt + 600 }),
    })
    await act(async () => {
      jest.advanceTimersByTime(session.expiresAt * 1000 - Date.now() - 30000)
    })
    expect(screen.getByTitle('Safe Support Chat')).not.toBe(frame)
  })
  it('fetches a fresh identity before retrying an unavailable iframe', async () => {
    render(<AuthenticatedSupportChat {...props} />)
    const frame = await readyFrame()
    act(() =>
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'https://support.test',
          source: frame.contentWindow,
          data: { type: 'pylon-chat-error' },
        }),
      ),
    )
    let resolveRetry!: (response: unknown) => void
    mockFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRetry = resolve
        }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.queryByTitle('Safe Support Chat')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Loading support')).toBeInTheDocument()
    expect(mockFetch).toHaveBeenCalledTimes(2)
    await act(async () =>
      resolveRetry({ ok: true, status: 200, json: async () => ({ ...session, jwt: 'fresh-token' }) }),
    )
    const replacement = screen.getByTitle('Safe Support Chat') as HTMLIFrameElement
    expect(replacement).not.toBe(frame)
    const post = jest.spyOn(replacement.contentWindow!, 'postMessage')
    act(() =>
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'https://support.test',
          source: replacement.contentWindow,
          data: { type: 'pylon-request-config' },
        }),
      ),
    )
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { chatSettings: expect.objectContaining({ jwt: 'fresh-token' }) } }),
      'https://support.test',
    )
  })

  it('forwards a refreshed JWT to the existing frame without interrupting it', async () => {
    render(<AuthenticatedSupportChat {...props} />)
    const frame = await readyFrame()
    const post = jest.spyOn(frame.contentWindow!, 'postMessage')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...session, jwt: 'refreshed-token', expiresAt: session.expiresAt + 600 }),
    })
    await act(async () => jest.advanceTimersByTime(session.expiresAt * 1000 - Date.now() - 30000))
    expect(screen.getByTitle('Safe Support Chat')).toBe(frame)
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ payload: { chatSettings: expect.objectContaining({ jwt: 'refreshed-token' }) } }),
      'https://support.test',
    )
  })

  it('clears the old frame on logout or authenticated user change', async () => {
    const { rerender } = render(<AuthenticatedSupportChat {...props} />)
    const frame = await readyFrame()
    rerender(<AuthenticatedSupportChat {...props} identityKey={undefined} />)
    expect(screen.queryByTitle('Safe Support Chat')).not.toBeInTheDocument()
    rerender(<AuthenticatedSupportChat {...props} identityKey="another-user" />)
    expect(await screen.findByTitle('Safe Support Chat')).not.toBe(frame)
  })
})
