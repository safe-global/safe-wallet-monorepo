import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import {
  cgwApi,
  type SpaceQueuedItemPage,
  type SpaceTransactionsGetTransactionQueueV1ApiArg,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { GATEWAY_URL } from '@/config/gateway'
import { makeStore } from '@/store'
import { server } from '@/tests/server'
import { selectSpaceQueuePolling, toSpaceQueueKey } from '../spaceQueuePollingSlice'

const spaceId = faker.string.uuid()
const unfiltered: SpaceTransactionsGetTransactionQueueV1ApiArg = { spaceId }
const filtered: SpaceTransactionsGetTransactionQueueV1ApiArg = { spaceId, status: ['sign'] }

const emptyPage: SpaceQueuedItemPage = {
  count: 0,
  next: null,
  previous: null,
  results: {},
  unavailableSafes: [],
  counts: {
    total: 0,
    execute: 0,
    sign: 0,
    blocked: 0,
    waiting: 0,
    conflicting: 0,
    stale: 0,
    safes: [],
    chains: [],
    signers: [],
  },
}

const answerWith = (statuses: number[]) => {
  const queue = [...statuses]
  server.use(
    http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`, () => {
      const status = queue.shift() ?? 200
      return status === 200 ? HttpResponse.json(emptyPage) : new HttpResponse(null, { status })
    }),
  )
}

const request = async (store: ReturnType<typeof makeStore>, args: SpaceTransactionsGetTransactionQueueV1ApiArg) => {
  const result = store.dispatch(
    cgwApi.endpoints.spaceTransactionsGetTransactionQueueV1.initiate(args, { forceRefetch: true }),
  )
  await result
  result.unsubscribe()
}

const failuresOf = (store: ReturnType<typeof makeStore>, args: SpaceTransactionsGetTransactionQueueV1ApiArg) =>
  selectSpaceQueuePolling(store.getState(), toSpaceQueueKey(args)).failures

describe('spaceQueuePollingSlice', () => {
  beforeEach(() => {
    setBaseUrl(GATEWAY_URL)
  })

  it('counts consecutive failed requests of a queue', async () => {
    answerWith([429, 503, 500])
    const store = makeStore()

    for (let i = 0; i < 3; i++) await request(store, unfiltered)

    expect(failuresOf(store, unfiltered)).toBe(3)
  })

  it('does not count a rejection that is not the service being busy', async () => {
    answerWith([401, 403, 404])
    const store = makeStore()

    for (let i = 0; i < 3; i++) await request(store, unfiltered)

    expect(failuresOf(store, unfiltered)).toBe(0)
  })

  it('counts a request that never reached the service', async () => {
    server.use(http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`, () => HttpResponse.error()))
    const store = makeStore()

    await request(store, unfiltered)

    expect(failuresOf(store, unfiltered)).toBe(1)
  })

  it('resets the count once a request of the queue succeeds', async () => {
    answerWith([503, 503, 200])
    const store = makeStore()

    for (let i = 0; i < 3; i++) await request(store, unfiltered)

    expect(failuresOf(store, unfiltered)).toBe(0)
  })

  it('keeps a separate count for a filtered queue', async () => {
    answerWith([503, 503])
    const store = makeStore()

    await request(store, filtered)
    await request(store, filtered)

    expect(failuresOf(store, filtered)).toBe(2)
    expect(failuresOf(store, unfiltered)).toBe(0)
  })

  it('records when the queue was last requested', async () => {
    answerWith([200])
    const store = makeStore()
    const before = Date.now()

    await request(store, unfiltered)

    expect(selectSpaceQueuePolling(store.getState(), toSpaceQueueKey(unfiltered)).lastStartedAt).toBeGreaterThanOrEqual(
      before,
    )
  })
})
