import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { configureStore } from '@reduxjs/toolkit'
import { faker } from '@faker-js/faker'
import { cosignerApi } from '../cosignerApi'
import type { CosignerTransactionDto } from '../cosignerApi.dto'

const SAFE_TX_HASH = faker.string.hexadecimal({ length: 64, casing: 'lower' })
const SERVICE_URL = 'https://cosigner.test'

describe('cosignerApi', () => {
  const server = setupServer()

  const makeStore = () =>
    configureStore({
      reducer: { [cosignerApi.reducerPath]: cosignerApi.reducer },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(cosignerApi.middleware),
    })

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('returns the co-signatures for a known transaction', async () => {
    const response: CosignerTransactionDto = {
      chainId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
      safeAddress: faker.finance.ethereumAddress(),
      safeTxHash: SAFE_TX_HASH,
      signatures: [
        {
          cosignerName: 'SAFE',
          status: 'SIGNED',
          ruleId: `rule_${faker.string.alphanumeric(8)}`,
          reason: null,
          signature: { signer: faker.finance.ethereumAddress(), data: faker.string.hexadecimal({ length: 130 }) },
          decidedAt: faker.date.recent().toISOString(),
        },
      ],
    }
    server.use(http.get(`${SERVICE_URL}/v1/transactions/${SAFE_TX_HASH}`, () => HttpResponse.json(response)))

    const result = await makeStore().dispatch(
      cosignerApi.endpoints.getCosignatures.initiate({ serviceUrl: SERVICE_URL, safeTxHash: SAFE_TX_HASH }),
    )

    expect(result.data).toEqual(response)
  })

  it('asks an ngrok-hosted service to skip its browser warning page', async () => {
    const ngrokUrl = `https://${faker.word.noun()}.ngrok-free.dev/api`
    const seenHeaders: Array<string | null> = []
    const handler = (url: string) =>
      http.get(`${url}/v1/transactions/${SAFE_TX_HASH}`, ({ request }) => {
        seenHeaders.push(request.headers.get('ngrok-skip-browser-warning'))
        return HttpResponse.json({ notFound: true }, { status: 404 })
      })
    server.use(handler(ngrokUrl), handler(SERVICE_URL))
    const store = makeStore()

    await store.dispatch(
      cosignerApi.endpoints.getCosignatures.initiate({ serviceUrl: ngrokUrl, safeTxHash: SAFE_TX_HASH }),
    )
    await store.dispatch(
      cosignerApi.endpoints.getCosignatures.initiate({ serviceUrl: SERVICE_URL, safeTxHash: SAFE_TX_HASH }),
    )

    expect(seenHeaders).toEqual(['1', null])
  })

  it('maps a 404 to a not-found result rather than an error', async () => {
    server.use(
      http.get(`${SERVICE_URL}/v1/transactions/${SAFE_TX_HASH}`, () =>
        HttpResponse.json({ message: 'Not Found', statusCode: 404 }, { status: 404 }),
      ),
    )

    const result = await makeStore().dispatch(
      cosignerApi.endpoints.getCosignatures.initiate({ serviceUrl: SERVICE_URL, safeTxHash: SAFE_TX_HASH }),
    )

    expect(result.error).toBeUndefined()
    expect(result.data).toEqual({ notFound: true })
  })

  it('surfaces a validation failure as an error', async () => {
    server.use(
      http.get(`${SERVICE_URL}/v1/transactions/bad`, () =>
        HttpResponse.json(
          { statusCode: 422, issues: [{ message: 'Invalid "0x" notated hex string' }] },
          { status: 422 },
        ),
      ),
    )

    const result = await makeStore().dispatch(
      cosignerApi.endpoints.getCosignatures.initiate({ serviceUrl: SERVICE_URL, safeTxHash: 'bad' }),
    )

    expect(result.error).toMatchObject({ status: 422 })
  })
})
