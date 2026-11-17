import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { renderHook, waitFor } from '@/tests/test-utils'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import type { SpaceQueuedItemPage, TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { TransactionListItemType } from '@safe-global/store/gateway/types'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { toSpaceQueue, useSpaceQueue, type SpaceQueueFilters } from '../spaceQueueApi'

const spaceId = faker.string.uuid()
const queueUrl = `${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`

const transactions = (count: number): TransactionQueuedItem[] =>
  Array.from({ length: count }, () => ({
    type: TransactionListItemType.TRANSACTION,
    conflictType: 'None',
    transaction: safeTxSummaryBuilder().build(),
  }))

const zeroCounts: SpaceQueuedItemPage['counts'] = {
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
}

const page = (
  results: SpaceQueuedItemPage['results'],
  overrides: Partial<SpaceQueuedItemPage> = {},
): SpaceQueuedItemPage => ({
  count: null,
  next: null,
  previous: null,
  results,
  unavailableSafes: [],
  counts: zeroCounts,
  ...overrides,
})

describe('toSpaceQueue', () => {
  const safeA = faker.finance.ethereumAddress()
  const safeB = faker.finance.ethereumAddress()

  it('turns the results into one section per Safe with one entry per chain', () => {
    const ethItems = transactions(2)
    const gnosisItems = transactions(1)
    const safeBItems = transactions(1)

    const queue = toSpaceQueue(
      page({ [safeA]: { '1': ethItems, '100': gnosisItems }, [safeB]: { '1': safeBItems } }, { count: 4 }),
    )

    expect(queue).toEqual({
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
      counts: zeroCounts,
      shownCount: 4,
      totalCount: 4,
      isComplete: true,
      unavailableSafes: [],
    })
  })

  it('flags the queue as incomplete when the gateway returned fewer transactions than the count', () => {
    expect(toSpaceQueue(page({ [safeA]: { '1': transactions(3) } }, { count: 10 }))).toMatchObject({
      shownCount: 3,
      totalCount: 10,
      isComplete: false,
    })
  })

  it('counts only transactions, not labels or conflict headers', () => {
    const items = [
      { type: TransactionListItemType.LABEL, label: 'Next' } as const,
      { type: TransactionListItemType.CONFLICT_HEADER, nonce: 1 } as const,
      ...transactions(2),
    ]

    expect(toSpaceQueue(page({ [safeA]: { '1': items } }, { count: 2 }))).toMatchObject({
      shownCount: 2,
      totalCount: 2,
      isComplete: true,
    })
  })

  it('treats a missing count as the transactions returned', () => {
    expect(toSpaceQueue(page({ [safeA]: { '1': transactions(2) } }, { count: null }))).toMatchObject({
      shownCount: 2,
      totalCount: 2,
      isComplete: true,
    })
  })

  it('passes the unavailable Safes through', () => {
    const unavailableSafes = [{ chainId: '1', safeAddress: safeB }]

    const queue = toSpaceQueue(page({ [safeA]: { '1': transactions(1) } }, { count: 1, unavailableSafes }))

    expect(queue.unavailableSafes).toEqual(unavailableSafes)
  })

  it('passes the counts through', () => {
    const counts = { ...zeroCounts, total: 2, sign: 2, safes: [{ chainId: '1', safeAddress: safeA, count: 2 }] }

    expect(toSpaceQueue(page({ [safeA]: { '1': transactions(2) } }, { count: 2, counts })).counts).toEqual(counts)
  })
})

/** Answers with the given body, recording every request URL. */
const respondWith = (body: SpaceQueuedItemPage) => {
  const urls: URL[] = []
  server.use(
    http.get(queueUrl, ({ request }) => {
      urls.push(new URL(request.url))
      return HttpResponse.json(body)
    }),
  )
  return urls
}

const fetchQueue = async (query?: { filters?: SpaceQueueFilters; search?: string }) => {
  const { result } = renderHook(() => useSpaceQueue(spaceId, query))
  await waitFor(() => expect(result.current.queue).toBeDefined())
  return result.current
}

describe('useSpaceQueue', () => {
  const safeA = faker.finance.ethereumAddress()
  const safeB = faker.finance.ethereumAddress()

  beforeEach(() => setBaseUrl(GATEWAY_URL))

  it('reads the whole queue of the Space in one request, without filters', async () => {
    const items = transactions(1)
    const urls: URL[] = []
    server.use(
      http.get(queueUrl, ({ request }) => {
        urls.push(new URL(request.url))
        return HttpResponse.json(page({ [safeA]: { '1': items } }, { count: 1 }))
      }),
    )

    const { result } = renderHook(() => useSpaceQueue(spaceId))

    await waitFor(() => expect(result.current.queue).toBeDefined())
    expect(result.current.queue?.sections).toEqual([{ safeAddress: safeA, chains: [{ chainId: '1', items }] }])
    expect(urls).toHaveLength(1)
    expect(urls[0].search).toBe('')
  })

  it('reports an error and no queue when the request fails', async () => {
    server.use(http.get(queueUrl, () => new HttpResponse(null, { status: 500 })))

    const { result } = renderHook(() => useSpaceQueue(spaceId))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.queue).toBeUndefined()
  })

  it('returns the counts of the answer', async () => {
    const counts = { ...zeroCounts, total: 1, sign: 1 }
    respondWith(page({ [safeA]: { '1': transactions(1) } }, { count: 1, counts }))

    const result = await fetchQueue()

    expect(result.counts).toEqual(counts)
  })

  it('sends the statuses, the flags, the Safes, the networks and the signers of the filters as query params', async () => {
    const urls = respondWith(page({}, { count: 0 }))
    const safes = [
      { chainId: '1', safeAddress: safeA },
      { chainId: '100', safeAddress: safeB },
    ]

    await fetchQueue({
      filters: {
        statuses: ['sign', 'conflicting', 'execute', 'stale'],
        safes,
        chainIds: ['1', '137'],
        signers: [safeA, safeB],
      },
    })

    expect(Object.fromEntries(urls[0].searchParams)).toEqual({
      status: 'sign,execute',
      conflicting: 'true',
      stale: 'true',
      safes: `1:${safeA},100:${safeB}`,
      chainIds: '1,137',
      signers: `${safeA},${safeB}`,
    })
  })

  it('sends only the params of the filters in use', async () => {
    const urls = respondWith(page({}, { count: 0 }))

    await fetchQueue({ filters: { statuses: ['conflicting'], safes: [], chainIds: [], signers: [] } })

    expect(Object.fromEntries(urls[0].searchParams)).toEqual({ conflicting: 'true' })
  })

  it('sends no params when no filter is chosen', async () => {
    const urls = respondWith(page({}, { count: 0 }))

    await fetchQueue({ filters: { statuses: [], safes: [], chainIds: [], signers: [] } })

    expect(urls[0].search).toBe('')
  })

  it('does not flag a filtered queue as incomplete for holding fewer transactions than the count', async () => {
    respondWith(page({ [safeA]: { '1': transactions(1) } }, { count: 10 }))

    const { queue } = await fetchQueue({ filters: { statuses: ['sign'], safes: [], chainIds: [], signers: [] } })

    expect(queue?.isComplete).toBe(true)
  })

  it('sends the search alone or with the filters', async () => {
    const urls = respondWith(page({}, { count: 0 }))

    await fetchQueue({ search: 'treasury' })
    await fetchQueue({ filters: { statuses: ['sign'], safes: [], chainIds: [], signers: [] }, search: 'polygon' })

    expect(Object.fromEntries(urls[0].searchParams)).toEqual({ search: 'treasury' })
    expect(Object.fromEntries(urls[1].searchParams)).toEqual({ status: 'sign', search: 'polygon' })
  })

  it('does not flag a searched queue as incomplete for holding fewer transactions than the count', async () => {
    respondWith(page({ [safeA]: { '1': transactions(1) } }, { count: 10 }))

    const { queue } = await fetchQueue({ search: 'treasury' })

    expect(queue?.isComplete).toBe(true)
  })
})
