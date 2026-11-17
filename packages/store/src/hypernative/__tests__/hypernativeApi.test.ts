import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureStore } from '@reduxjs/toolkit'
import { hypernativeApi } from '../hypernativeApi'

describe('hypernativeApi', () => {
  const server = setupServer()

  const makeStore = () =>
    configureStore({
      reducer: { [hypernativeApi.reducerPath]: hypernativeApi.reducer },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(hypernativeApi.middleware),
    })

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  describe('exchangeToken', () => {
    it('sends a refresh grant only once when the server fails', async () => {
      const requests: unknown[] = []
      server.use(
        http.post('*/oauth/token', async ({ request }) => {
          requests.push(await request.json())
          return HttpResponse.json({ success: false, data: {}, error: 'server_error' }, { status: 503 })
        }),
      )

      const result = await makeStore().dispatch(
        hypernativeApi.endpoints.exchangeToken.initiate({
          grant_type: 'refresh_token',
          client_id: 'client-id',
          refresh_token: 'refresh-1',
        }),
      )

      expect(requests).toEqual([{ grant_type: 'refresh_token', client_id: 'client-id', refresh_token: 'refresh-1' }])
      expect(result).toMatchObject({ error: { success: false, error: 'server_error' } })
    })

    it('returns the token pair from the response envelope', async () => {
      const tokens = {
        access_token: 'access-2',
        token_type: 'Bearer',
        expires_in: 300,
        scope: 'read',
        refresh_token: 'refresh-2',
        refresh_expires_in: 2591700,
      }
      server.use(http.post('*/oauth/token', () => HttpResponse.json({ data: tokens })))

      const result = await makeStore().dispatch(
        hypernativeApi.endpoints.exchangeToken.initiate({
          grant_type: 'refresh_token',
          client_id: 'client-id',
          refresh_token: 'refresh-1',
        }),
      )

      expect(result).toMatchObject({ data: tokens })
    })
  })
})
