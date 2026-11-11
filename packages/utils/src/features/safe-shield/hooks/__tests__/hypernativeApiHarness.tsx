import type { ReactNode } from 'react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { http } from 'msw'
import { setupServer } from 'msw/node'
import { renderHook } from '@testing-library/react'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/config/constants'

const server = setupServer()

export const startHypernativeServer = (): void => {
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
 * @param respond - Builds the response for each request
 * @returns The live list of received requests
 */
export const answerHypernative = (path: string, respond: () => Response | Promise<Response>): HypernativeRequest[] => {
  const requests: HypernativeRequest[] = []
  server.use(
    http.post(`${HYPERNATIVE_API_BASE_URL}${path}`, async ({ request }) => {
      requests.push({ body: await request.json(), authorization: request.headers.get('Authorization') })
      return respond()
    }),
  )
  return requests
}

export const renderWithHypernativeApi = <Result, Props>(
  hook: (props: Props) => Result,
  options?: { initialProps: Props },
) => {
  const store = configureStore({
    reducer: { [hypernativeApi.reducerPath]: hypernativeApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(hypernativeApi.middleware),
  })
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  return renderHook(hook, { wrapper, ...options })
}
