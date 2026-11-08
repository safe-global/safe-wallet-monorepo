import { faker } from '@faker-js/faker'
import { configureStore } from '@reduxjs/toolkit'
import { HYPERNATIVE_API_BASE_URL } from '@safe-global/utils/config/constants'
import type { HypernativeTx } from '@safe-global/utils/features/safe-shield/types/hypernative.type'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { hypernativeApi } from './hypernativeApi'

const ASSESSMENT_URL = `${HYPERNATIVE_API_BASE_URL}/safe/transaction/assessment`
const NO_RETRY_PROBE_URL = `${HYPERNATIVE_API_BASE_URL}/no-retry-probe`

const probeApi = hypernativeApi.injectEndpoints({
  endpoints: (build) => ({
    noRetryProbe: build.mutation<unknown, void>({
      query: () => ({ url: '/no-retry-probe', method: 'POST' }),
      extraOptions: { maxRetries: 0 },
    }),
  }),
})

const server = setupServer()

const makeStore = () =>
  configureStore({
    reducer: { [hypernativeApi.reducerPath]: hypernativeApi.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(hypernativeApi.middleware),
  })

const address = () => faker.finance.ethereumAddress() as `0x${string}`

const randomTx = (): HypernativeTx => ({
  chain: faker.string.numeric(3),
  input: '0x',
  operation: '0',
  toAddress: address(),
  fromAddress: address(),
  safeTxGas: '0',
  value: faker.string.numeric(6),
  baseGas: '0',
  gasPrice: '0',
  gasToken: address(),
  refundReceiver: address(),
  nonce: faker.string.numeric(2),
})

const assessTransaction = (store: ReturnType<typeof makeStore>) =>
  store.dispatch(
    hypernativeApi.endpoints.assessTransaction.initiate({
      authToken: `Bearer ${faker.string.alphanumeric(32)}`,
      safeAddress: address(),
      safeTxHash: faker.string.hexadecimal({ length: 64, casing: 'lower' }) as `0x${string}`,
      transaction: randomTx(),
    }),
  )

const countRequestsTo = (url: string, respond: () => Response): (() => number) => {
  let requests = 0
  server.use(
    http.post(url, () => {
      requests += 1
      return respond()
    }),
  )
  return () => requests
}

describe('hypernativeApi retries', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it.each([400, 401, 403, 404, 409, 422])('sends a request the API rejects with %s exactly once', async (status) => {
    const requests = countRequestsTo(ASSESSMENT_URL, () =>
      HttpResponse.json({ success: false, data: null, error: faker.lorem.sentence(), errorCode: status }, { status }),
    )

    await assessTransaction(makeStore())

    expect(requests()).toBe(1)
  })

  it('sends a 401 whose body is not JSON exactly once', async () => {
    const requests = countRequestsTo(
      ASSESSMENT_URL,
      () => new HttpResponse('<html>Unauthorized</html>', { status: 401 }),
    )

    await assessTransaction(makeStore())

    expect(requests()).toBe(1)
  })

  it('keeps the rejected body as the error of a 401', async () => {
    const body = { success: false, data: null, error: faker.lorem.sentence(), errorCode: 1038 }
    countRequestsTo(ASSESSMENT_URL, () => HttpResponse.json(body, { status: 401 }))

    const result = await assessTransaction(makeStore())

    expect(result.error).toEqual(body)
  })

  it.each([429, 500])('retries a request that fails with %s twice', async (status) => {
    const requests = countRequestsTo(ASSESSMENT_URL, () => HttpResponse.json({}, { status }))

    await assessTransaction(makeStore())

    expect(requests()).toBe(3)
  })

  it.each([
    ['a 500', () => HttpResponse.json({}, { status: 500 })],
    ['a network error', () => HttpResponse.error()],
  ])('honours an endpoint maxRetries of 0 on %s', async (_label, respond) => {
    const requests = countRequestsTo(NO_RETRY_PROBE_URL, respond)

    await makeStore().dispatch(probeApi.endpoints.noRetryProbe.initiate())

    expect(requests()).toBe(1)
  })
})
