import type { ReactNode } from 'react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { http } from 'msw'
import { setupServer } from 'msw/node'
import { renderHook } from '@testing-library/react'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/config/constants'

const server = setupServer()

export const setupHypernativeServer = (): void => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
}

export type HypernativeRequest = {
  body: unknown
  authorization: string | null
}

/**
 * Answers every POST to a Hypernative API path and records the requests it receives.
 *
 * @param path - The API path, e.g. '/safe/eip712/assessment'
 * @param respond - Builds the response for each request, from its body and abort signal
 * @returns The live list of received requests
 */
export const answerHypernative = (
  path: string,
  respond: (request: { body: unknown; signal: AbortSignal }) => Response | Promise<Response>,
): HypernativeRequest[] => {
  const requests: HypernativeRequest[] = []
  server.use(
    http.post(`${HYPERNATIVE_API_BASE_URL}${path}`, async ({ request }) => {
      const body = await request.json()
      requests.push({ body, authorization: request.headers.get('Authorization') })
      return respond({ body, signal: request.signal })
    }),
  )
  return requests
}

export const makeHypernativeStore = () =>
  configureStore({
    reducer: { [hypernativeApi.reducerPath]: hypernativeApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(hypernativeApi.middleware),
  })

export const renderWithHypernativeApi = <Result, Props>(
  hook: (props: Props) => Result,
  {
    initialProps,
    store = makeHypernativeStore(),
  }: { initialProps?: Props; store?: ReturnType<typeof makeHypernativeStore> } = {},
) => {
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  return renderHook(hook, { wrapper, initialProps })
}
