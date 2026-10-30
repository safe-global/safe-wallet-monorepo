import { faker } from '@faker-js/faker'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { cgwClient, setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import type { SpaceQueuedItemPage, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { TransactionListItemType } from '@safe-global/store/gateway/types'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { spaceQueueApi } from '../spaceQueueApi'

const spaceId = faker.string.uuid()
const queueUrl = `${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`

const makeStore = () => {
  setBaseUrl(GATEWAY_URL)
  return configureStore({
    reducer: combineReducers({ [cgwClient.reducerPath]: cgwClient.reducer }),
    middleware: (getDefault) => getDefault({ serializableCheck: false }).concat(cgwClient.middleware),
  })
}

const transactions = (count: number): TransactionQueuedItem[] =>
  Array.from({ length: count }, () => ({
    type: TransactionListItemType.TRANSACTION,
    conflictType: 'None',
    transaction: safeTxSummaryBuilder().build(),
  }))

const page = (results: SpaceQueuedItemPage['results'], overrides: Partial<SpaceQueuedItemPage> = {}) => ({
  count: null,
  next: null,
  previous: null,
  results,
  unavailableSafes: [],
  ...overrides,
})

/** Answers with the given body, recording every request URL. */
const respondWith = (body: SpaceQueuedItemPage | null, status = 200) => {
  const urls: URL[] = []
  server.use(
    http.get(queueUrl, ({ request }) => {
      urls.push(new URL(request.url))
      return body ? HttpResponse.json(body) : new HttpResponse(null, { status })
    }),
  )
  return urls
}

const fetchQueue = (store: ReturnType<typeof makeStore>) =>
  store.dispatch(spaceQueueApi.endpoints.getSpaceQueue.initiate({ spaceId }))

describe('spaceQueueApi.getSpaceQueue', () => {
  const safeA = faker.finance.ethereumAddress()
  const safeB = faker.finance.ethereumAddress()

  it('turns the results into one section per Safe with one entry per chain', async () => {
    const ethItems = transactions(2)
    const gnosisItems = transactions(1)
    const safeBItems = transactions(1)
    respondWith(page({ [safeA]: { '1': ethItems, '100': gnosisItems }, [safeB]: { '1': safeBItems } }, { count: 4 }))

    const { data } = await fetchQueue(makeStore())

    expect(data).toEqual({
      sections: [
        {
          safeAddress: safeA,
          chains: [
            { chainId: '1', items: ethItems },
            { chainId: '100', items: gnosisItems },
          ],
        },
        { safeAddress: safeB, chains: [{ chainId: '1', items: safeBItems }] },
      ],
      unavailableSafes: [],
      shownCount: 4,
      totalCount: 4,
      isComplete: true,
    })
  })

  it('reads the whole queue in one request without a cursor', async () => {
    const urls = respondWith(page({ [safeA]: { '1': transactions(1) } }, { count: 1 }))

    await fetchQueue(makeStore())

    expect(urls).toHaveLength(1)
    expect(urls[0].search).toBe('')
  })

  it('flags the queue as incomplete when the gateway returned fewer transactions than the count', async () => {
    respondWith(page({ [safeA]: { '1': transactions(3) } }, { count: 10 }))

    const { data } = await fetchQueue(makeStore())

    expect(data).toMatchObject({ shownCount: 3, totalCount: 10, isComplete: false })
  })

  it('counts only transactions, not labels or conflict headers', async () => {
    const items = [
      { type: TransactionListItemType.LABEL, label: 'Next' } as const,
      { type: TransactionListItemType.CONFLICT_HEADER, nonce: 1 } as const,
      ...transactions(2),
    ]
    respondWith(page({ [safeA]: { '1': items } }, { count: 2 }))

    const { data } = await fetchQueue(makeStore())

    expect(data).toMatchObject({ shownCount: 2, totalCount: 2, isComplete: true })
  })

  it('treats a missing count as the transactions returned', async () => {
    respondWith(page({ [safeA]: { '1': transactions(2) } }, { count: null }))

    const { data } = await fetchQueue(makeStore())

    expect(data).toMatchObject({ shownCount: 2, totalCount: 2, isComplete: true })
  })

  it('passes the unavailable Safes through', async () => {
    const unavailableSafes = [{ chainId: '1', safeAddress: safeB }]
    respondWith(page({}, { count: 0, unavailableSafes }))

    const { data } = await fetchQueue(makeStore())

    expect(data).toMatchObject({ sections: [], unavailableSafes, isComplete: true })
  })

  it('fails when the request fails', async () => {
    respondWith(null, 500)

    const result = await fetchQueue(makeStore())

    expect(result.isError).toBe(true)
    expect(result.data).toBeUndefined()
  })
})
