import { http, HttpResponse } from 'msw'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { CookieAndTermType, cookiesAndTermsInitialState } from '@/store/cookiesAndTermsSlice'
import { version as termsVersion } from '@/markdown/terms/version'
import local from '@/services/local-storage/local'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useBeamerUpdates } from '../useBeamerUpdates'

jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  BEAMER_ID: 'product-id',
}))

const NUMBER_FEATURES_URL = 'https://backend.getbeamer.com/numberFeatures'

describe('useBeamerUpdates', () => {
  afterEach(() => {
    // Clears the in-memory copy that useLocalStorage keeps per key as well as localStorage itself.
    const { result } = renderHook(() => useLocalStorage<string>('beamerLastSeen'))
    act(() => result.current[1](() => undefined))
  })

  it('should, when the user has not accepted updates cookies, not ask Beamer for updates', async () => {
    const requests: URL[] = []
    server.use(
      http.get(NUMBER_FEATURES_URL, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json({ number: 2 })
      }),
    )

    const { result } = renderHook(() => useBeamerUpdates(), {
      initialReduxState: { cookies_terms: { ...cookiesAndTermsInitialState, termsVersion } },
    })
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(requests).toHaveLength(0)
    expect(result.current.unreadCount).toBe(0)
  })

  it('should, when a last-seen date is stored, send it with the first request', async () => {
    const requests: URL[] = []
    server.use(
      http.get(NUMBER_FEATURES_URL, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json({ number: 2 })
      }),
    )
    local.setItem('beamerLastSeen', '2026-06-01T00:00:00.000Z')

    const { result } = renderHook(() => useBeamerUpdates(), {
      initialReduxState: {
        cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.UPDATES]: true, termsVersion },
      },
    })

    await waitFor(() => expect(result.current.unreadCount).toBe(2))
    expect(requests[0].searchParams.get('date')).toBe('2026-06-01T00:00:00.000Z')
  })

  it('should, when the posts are marked as seen, ask Beamer again with the new date', async () => {
    const requests: URL[] = []
    server.use(
      http.get(NUMBER_FEATURES_URL, ({ request }) => {
        const url = new URL(request.url)
        requests.push(url)
        return HttpResponse.json({ number: url.searchParams.has('date') ? 0 : 2 })
      }),
    )

    const { result } = renderHook(() => useBeamerUpdates(), {
      initialReduxState: {
        cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.UPDATES]: true, termsVersion },
      },
    })
    await waitFor(() => expect(result.current.unreadCount).toBe(2))

    const before = Date.now()
    act(() => result.current.markAsSeen())

    await waitFor(() => expect(result.current.unreadCount).toBe(0))
    const sentDate = requests[requests.length - 1].searchParams.get('date')
    expect(sentDate).not.toBeNull()
    expect(Date.parse(sentDate ?? '')).toBeGreaterThanOrEqual(before)
    expect(local.getItem('beamerLastSeen')).toBe(sentDate)
  })
})
