import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { CookieAndTermType, cookiesAndTermsInitialState } from '@/store/cookiesAndTermsSlice'
import { version as termsVersion } from '@/markdown/terms/version'

export const NUMBER_FEATURES_URL = 'https://backend.getbeamer.com/numberFeatures'

/**
 * Answers Beamer's numberFeatures endpoint with `respond(url)` and returns the list of request URLs,
 * which grows as requests come in.
 */
export const recordBeamerRequests = (respond: (url: URL) => object): URL[] => {
  const requests: URL[] = []
  server.use(
    http.get(NUMBER_FEATURES_URL, ({ request }) => {
      const url = new URL(request.url)
      requests.push(url)
      return HttpResponse.json(respond(url))
    }),
  )
  return requests
}

const cookiesState = (hasUpdatesConsent: boolean) => ({
  cookies_terms: { ...cookiesAndTermsInitialState, [CookieAndTermType.UPDATES]: hasUpdatesConsent, termsVersion },
})

export const withUpdatesConsent = { initialReduxState: cookiesState(true) }
export const withoutUpdatesConsent = { initialReduxState: cookiesState(false) }
