import { http, HttpResponse } from 'msw'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { CookieAndTermType, cookiesAndTermsInitialState } from '@/store/cookiesAndTermsSlice'
import { version as termsVersion } from '@/markdown/terms/version'
import { useBeamerLiveUpdates } from '../useBeamerLiveUpdates'
import { useBeamerUpdates } from '../useBeamerUpdates'

jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  BEAMER_ID: 'product-id',
}))

const NUMBER_FEATURES_URL = 'https://backend.getbeamer.com/numberFeatures'
const UPDATES_FRAME_SELECTOR = 'iframe[src="https://app.getbeamer.com/utilities?app_id=product-id"]'

describe('useBeamerLiveUpdates', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("should, when the user has not accepted updates cookies, not add Beamer's update frame", () => {
    renderHook(() => useBeamerLiveUpdates(), {
      initialReduxState: { cookies_terms: { ...cookiesAndTermsInitialState, termsVersion } },
    })

    expect(document.querySelector(UPDATES_FRAME_SELECTOR)).toBeNull()
  })

  it("should, when the user has accepted updates cookies, add Beamer's update frame hidden and sandboxed", () => {
    renderHook(() => useBeamerLiveUpdates(), {
      initialReduxState: {
        cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.UPDATES]: true, termsVersion },
      },
    })

    const frame = document.querySelector(UPDATES_FRAME_SELECTOR)
    expect(frame).not.toBeNull()
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin')
    expect(frame).toHaveAttribute('hidden')
  })

  it("should, when Beamer's update frame has loaded, ask it to start listening for new posts", () => {
    renderHook(() => useBeamerLiveUpdates(), {
      initialReduxState: {
        cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.UPDATES]: true, termsVersion },
      },
    })
    const frame = document.querySelector<HTMLIFrameElement>(UPDATES_FRAME_SELECTOR)
    const postMessage = jest.spyOn(frame?.contentWindow as Window, 'postMessage').mockImplementation(() => {})

    frame?.dispatchEvent(new Event('load'))

    expect(postMessage).toHaveBeenCalledWith('initUpdatesListener', 'https://app.getbeamer.com')
  })

  it('should, when the hook unmounts, remove the update frame', () => {
    const { unmount } = renderHook(() => useBeamerLiveUpdates(), {
      initialReduxState: {
        cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.UPDATES]: true, termsVersion },
      },
    })

    unmount()

    expect(document.querySelector(UPDATES_FRAME_SELECTOR)).toBeNull()
  })

  it('should, when Beamer announces an immediate update, ask Beamer for updates again', async () => {
    const requests: URL[] = []
    server.use(
      http.get(NUMBER_FEATURES_URL, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json({ number: requests.length })
      }),
    )
    const { result } = renderHook(
      () => {
        useBeamerLiveUpdates()
        return useBeamerUpdates()
      },
      {
        initialReduxState: {
          cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.UPDATES]: true, termsVersion },
        },
      },
    )
    await waitFor(() => expect(result.current.unreadCount).toBe(1))

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'https://app.getbeamer.com',
          data: 'updatesAvailable:{"immediate":true}',
        }),
      )
    })

    await waitFor(() => expect(result.current.unreadCount).toBe(2))
    expect(requests).toHaveLength(2)
  })

  it('should, when Beamer announces an update that is not immediate, wait a random time before asking again', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.0005)
    const requests: URL[] = []
    server.use(
      http.get(NUMBER_FEATURES_URL, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json({ number: requests.length })
      }),
    )
    const { result } = renderHook(
      () => {
        useBeamerLiveUpdates()
        return useBeamerUpdates()
      },
      {
        initialReduxState: {
          cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.UPDATES]: true, termsVersion },
        },
      },
    )
    await waitFor(() => expect(result.current.unreadCount).toBe(1))

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { origin: 'https://app.getbeamer.com', data: 'updatesAvailable' }),
      )
    })
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(requests).toHaveLength(1)
    await waitFor(() => expect(result.current.unreadCount).toBe(2))
  })

  it('should, when an update announcement comes from another origin, ignore it', async () => {
    const requests: URL[] = []
    server.use(
      http.get(NUMBER_FEATURES_URL, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json({ number: requests.length })
      }),
    )
    const { result } = renderHook(
      () => {
        useBeamerLiveUpdates()
        return useBeamerUpdates()
      },
      {
        initialReduxState: {
          cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.UPDATES]: true, termsVersion },
        },
      },
    )
    await waitFor(() => expect(result.current.unreadCount).toBe(1))

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { origin: 'https://evil.example', data: 'updatesAvailable:{"immediate":true}' }),
      )
    })
    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(requests).toHaveLength(1)
  })
})
