import { act, renderHook, waitFor } from '@/tests/test-utils'
import { recordBeamerRequests, withUpdatesConsent } from '@/tests/whatsNew'
import { MAX_UPDATE_DELAY, useWhatsNewUpdateListener } from '../useWhatsNewUpdateListener'
import { useWhatsNewUpdates } from '../useWhatsNewUpdates'

jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  BEAMER_ID: 'product-id',
}))

const postMessage = (origin: string, data: string) =>
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { origin, data }))
  })

describe('useWhatsNewUpdateListener', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should, when Beamer announces an immediate update, ask Beamer for updates again at once', async () => {
    const requests = recordBeamerRequests(() => ({ number: requests.length }))
    const { result } = renderHook(() => {
      useWhatsNewUpdateListener()
      return useWhatsNewUpdates()
    }, withUpdatesConsent)
    await waitFor(() => expect(result.current.unreadCount).toBe(1))

    postMessage('https://app.getbeamer.com', 'updatesAvailable:{"immediate":true}')
    await act(() => jest.advanceTimersByTimeAsync(0))

    await waitFor(() => expect(result.current.unreadCount).toBe(2))
  })

  it('should, when the immediate flag is written with spaces, still ask Beamer for updates at once', async () => {
    const requests = recordBeamerRequests(() => ({ number: requests.length }))
    const { result } = renderHook(() => {
      useWhatsNewUpdateListener()
      return useWhatsNewUpdates()
    }, withUpdatesConsent)
    await waitFor(() => expect(result.current.unreadCount).toBe(1))

    postMessage('https://app.getbeamer.com', 'updatesAvailable:{ "immediate": true }')
    await act(() => jest.advanceTimersByTimeAsync(0))

    await waitFor(() => expect(result.current.unreadCount).toBe(2))
  })

  it('should, when Beamer announces an update that is not immediate, wait the random delay before asking again', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(1)
    const requests = recordBeamerRequests(() => ({ number: requests.length }))
    const { result } = renderHook(() => {
      useWhatsNewUpdateListener()
      return useWhatsNewUpdates()
    }, withUpdatesConsent)
    await waitFor(() => expect(result.current.unreadCount).toBe(1))

    postMessage('https://app.getbeamer.com', 'updatesAvailable')
    await act(() => jest.advanceTimersByTimeAsync(MAX_UPDATE_DELAY / 2))
    expect(requests).toHaveLength(1)

    await act(() => jest.advanceTimersByTimeAsync(MAX_UPDATE_DELAY / 2))
    await waitFor(() => expect(result.current.unreadCount).toBe(2))
  })

  it('should, when an update announcement comes from another origin, ignore it', async () => {
    const requests = recordBeamerRequests(() => ({ number: requests.length }))
    const { result } = renderHook(() => {
      useWhatsNewUpdateListener()
      return useWhatsNewUpdates()
    }, withUpdatesConsent)
    await waitFor(() => expect(result.current.unreadCount).toBe(1))

    postMessage('https://evil.example', 'updatesAvailable:{"immediate":true}')
    await act(() => jest.advanceTimersByTimeAsync(MAX_UPDATE_DELAY))

    expect(requests).toHaveLength(1)
  })

  it('should, when the announcement payload is not JSON, ignore it', async () => {
    const requests = recordBeamerRequests(() => ({ number: requests.length }))
    const { result } = renderHook(() => {
      useWhatsNewUpdateListener()
      return useWhatsNewUpdates()
    }, withUpdatesConsent)
    await waitFor(() => expect(result.current.unreadCount).toBe(1))

    postMessage('https://app.getbeamer.com', 'updatesAvailable:not json')
    await act(() => jest.advanceTimersByTimeAsync(MAX_UPDATE_DELAY))

    expect(requests).toHaveLength(1)
  })
})
