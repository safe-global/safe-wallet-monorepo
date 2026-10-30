import { http, HttpResponse } from 'msw'
import { renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { useGetBeamerUpdatesQuery } from './beamer'

const NUMBER_FEATURES_URL = 'https://backend.getbeamer.com/numberFeatures'

describe('useGetBeamerUpdatesQuery', () => {
  it('should, when given a last-seen date, send it with the product and host and return the unread count', async () => {
    const requests: URL[] = []
    server.use(
      http.get(NUMBER_FEATURES_URL, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json({ number: 3 })
      }),
    )

    const { result } = renderHook(() =>
      useGetBeamerUpdatesQuery({ productId: 'product-id', lastSeen: '2026-06-01T00:00:00.000Z' }),
    )

    await waitFor(() => expect(result.current.data).toEqual({ unreadCount: 3 }))
    expect(requests).toHaveLength(1)
    expect(requests[0].searchParams.get('product')).toBe('product-id')
    expect(requests[0].searchParams.get('url')).toBe(window.location.host)
    expect(requests[0].searchParams.get('date')).toBe('2026-06-01T00:00:00.000Z')
  })

  it('should, when no last-seen date is given, leave the date out of the request', async () => {
    const requests: URL[] = []
    server.use(
      http.get(NUMBER_FEATURES_URL, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json({ number: 0 })
      }),
    )

    const { result } = renderHook(() => useGetBeamerUpdatesQuery({ productId: 'product-id' }))

    await waitFor(() => expect(result.current.data).toEqual({ unreadCount: 0 }))
    expect(requests[0].searchParams.has('date')).toBe(false)
  })

  it('should, when Beamer returns a count that is not a whole number, report no unread posts', async () => {
    server.use(http.get(NUMBER_FEATURES_URL, () => HttpResponse.json({ number: '3' })))

    const { result } = renderHook(() => useGetBeamerUpdatesQuery({ productId: 'product-id' }))

    await waitFor(() => expect(result.current.data).toEqual({ unreadCount: 0 }))
  })
})
