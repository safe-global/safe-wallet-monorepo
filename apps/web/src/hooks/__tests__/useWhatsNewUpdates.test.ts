import { act, clearLocalStorageKey, renderHook, waitFor } from '@/tests/test-utils'
import { recordBeamerRequests, withoutUpdatesConsent, withUpdatesConsent } from '@/tests/whatsNew'
import local from '@/services/local-storage/local'
import { useWhatsNewUpdates } from '../useWhatsNewUpdates'

jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  BEAMER_ID: 'product-id',
}))

describe('useWhatsNewUpdates', () => {
  beforeEach(() => jest.useFakeTimers({ advanceTimers: false }))

  afterEach(() => {
    clearLocalStorageKey('whatsNewLastSeen')
  })

  it('should, when the user has not accepted updates cookies, not ask Beamer for updates', async () => {
    const requests = recordBeamerRequests(() => ({ number: 2 }))

    const { result } = renderHook(() => useWhatsNewUpdates(), withoutUpdatesConsent)
    await act(() => jest.advanceTimersByTimeAsync(60 * 1000))

    expect(requests).toHaveLength(0)
    expect(result.current.unreadCount).toBe(0)
  })

  it('should, when a last-seen date is stored, send it with the first request', async () => {
    const requests = recordBeamerRequests(() => ({ number: 2 }))
    local.setItem('whatsNewLastSeen', '2026-06-01T00:00:00.000Z')

    const { result } = renderHook(() => useWhatsNewUpdates(), withUpdatesConsent)

    await waitFor(() => expect(result.current.unreadCount).toBe(2))
    expect(requests[0].searchParams.get('date')).toBe('2026-06-01T00:00:00.000Z')
  })

  it('should, when the posts are marked as seen, ask Beamer again with the new date', async () => {
    const requests = recordBeamerRequests((url) => ({ number: url.searchParams.has('date') ? 0 : 2 }))

    const { result } = renderHook(() => useWhatsNewUpdates(), withUpdatesConsent)
    await waitFor(() => expect(result.current.unreadCount).toBe(2))

    const before = Date.now()
    act(() => result.current.markAsSeen())

    await waitFor(() => expect(result.current.unreadCount).toBe(0))
    const sentDate = requests[requests.length - 1].searchParams.get('date')
    expect(sentDate).not.toBeNull()
    expect(Date.parse(sentDate ?? '')).toBeGreaterThanOrEqual(before)
    expect(local.getItem('whatsNewLastSeen')).toBe(sentDate)
  })
})
