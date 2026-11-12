import { delay, http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { fakerChecksummedAddress } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import { apiSliceWithChainsConfig, chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'
import { initialState as initialSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import { makeStore, setStoreInstance } from '@/store'
import { gatewayApi } from '../api/gateway'
import { CHAINS_WAIT_CAP_MS, SAFE_OVERVIEWS_BATCH_WINDOW_MS } from '../api/gateway/safeOverviews'

const TRUSTED_TOKENLIST = [FEATURES.PORTFOLIO_ENDPOINT, FEATURES.DEFAULT_TOKENLIST]

const recordSafesRequests = () => {
  const requests: URLSearchParams[] = []
  server.use(
    http.get(`${GATEWAY_URL}/v2/safes`, ({ request }) => {
      const params = new URL(request.url).searchParams
      requests.push(params)
      const overviews = (params.get('safes') ?? '').split(',').map((safeId) => {
        const [chainId, address] = safeId.split(':')
        return {
          address: { value: address },
          chainId,
          awaitingConfirmation: null,
          fiatTotal: faker.finance.amount(),
          owners: [{ value: faker.finance.ethereumAddress() }],
          threshold: 1,
          queued: 0,
        }
      })
      return HttpResponse.json(overviews)
    }),
  )
  return requests
}

const requestOverviews = async (
  chains: Chain[],
  safes: Array<{ chainId: string; address: string }>,
  tokenList = TOKEN_LISTS.TRUSTED,
) => {
  const store = makeStore({ settings: { ...initialSettings, tokenList } })
  setStoreInstance(store)
  await store.dispatch(
    apiSliceWithChainsConfig.util.upsertQueryData(
      'getChainsConfigV2',
      CONFIG_SERVICE_KEY,
      chainsAdapter.setAll(chainsInitialState, chains),
    ),
  )
  const query = store.dispatch(gatewayApi.endpoints.getMultipleSafeOverviews.initiate({ currency: 'usd', safes }))
  await query
  query.unsubscribe()
}

describe('safeOverviews trusted param', () => {
  it('sends trusted=false on a chain without PORTFOLIO_SUMMARIES', async () => {
    const requests = recordSafesRequests()
    const chain = chainBuilder().with({ features: TRUSTED_TOKENLIST }).build()

    await requestOverviews([chain], [{ chainId: chain.chainId, address: fakerChecksummedAddress() }])

    expect(requests.map((params) => params.get('trusted'))).toEqual(['false'])
  })

  it('sends the trusted value of the default token list on a chain with PORTFOLIO_SUMMARIES', async () => {
    const requests = recordSafesRequests()
    const chain = chainBuilder()
      .with({ features: [...TRUSTED_TOKENLIST, FEATURES.PORTFOLIO_SUMMARIES] })
      .build()

    await requestOverviews([chain], [{ chainId: chain.chainId, address: fakerChecksummedAddress() }])

    expect(requests.map((params) => params.get('trusted'))).toEqual(['true'])
  })

  it('sends trusted=false on a chain with PORTFOLIO_SUMMARIES when the user shows all tokens', async () => {
    const requests = recordSafesRequests()
    const chain = chainBuilder()
      .with({ features: [...TRUSTED_TOKENLIST, FEATURES.PORTFOLIO_SUMMARIES] })
      .build()

    await requestOverviews([chain], [{ chainId: chain.chainId, address: fakerChecksummedAddress() }], TOKEN_LISTS.ALL)

    expect(requests.map((params) => params.get('trusted'))).toEqual(['false'])
  })

  it('sends one request per trusted value when the batched Safes disagree', async () => {
    const requests = recordSafesRequests()
    const summariesChain = chainBuilder()
      .with({ chainId: '1', features: [...TRUSTED_TOKENLIST, FEATURES.PORTFOLIO_SUMMARIES] })
      .build()
    const otherChain = chainBuilder().with({ chainId: '137', features: TRUSTED_TOKENLIST }).build()
    const safe = fakerChecksummedAddress()

    await requestOverviews(
      [summariesChain, otherChain],
      [
        { chainId: summariesChain.chainId, address: safe },
        { chainId: otherChain.chainId, address: safe },
      ],
    )

    expect(requests.map((params) => [params.get('trusted'), params.get('safes')]).sort()).toEqual([
      ['false', `${otherChain.chainId}:${safe}`],
      ['true', `${summariesChain.chainId}:${safe}`],
    ])
  })

  describe('on a cold load', () => {
    const flaggedChain = () =>
      chainBuilder()
        .with({ features: [...TRUSTED_TOKENLIST, FEATURES.PORTFOLIO_SUMMARIES] })
        .build()

    const serveChainsAfter = (chain: Chain, ms: number) =>
      server.use(
        http.get(`${GATEWAY_URL}/v2/chains`, async () => {
          await delay(ms)
          return HttpResponse.json({ results: [chain], next: null })
        }),
      )

    const requestWhileChainsLoad = async (chain: Chain) => {
      const store = makeStore({ settings: initialSettings })
      setStoreInstance(store)
      const chainsQuery = store.dispatch(
        apiSliceWithChainsConfig.endpoints.getChainsConfigV2.initiate(CONFIG_SERVICE_KEY),
      )
      const startedAt = Date.now()
      const overviewsQuery = store.dispatch(
        gatewayApi.endpoints.getMultipleSafeOverviews.initiate({
          currency: 'usd',
          safes: [{ chainId: chain.chainId, address: fakerChecksummedAddress() }],
        }),
      )
      await overviewsQuery
      const elapsed = Date.now() - startedAt
      overviewsQuery.unsubscribe()
      chainsQuery.unsubscribe()
      return elapsed
    }

    it('does not wait for a chain configs refetch when they are already loaded', async () => {
      const requests = recordSafesRequests()
      const chain = flaggedChain()
      serveChainsAfter(chain, CHAINS_WAIT_CAP_MS / 2)
      const store = makeStore({ settings: initialSettings })
      setStoreInstance(store)
      await store.dispatch(
        apiSliceWithChainsConfig.util.upsertQueryData(
          'getChainsConfigV2',
          CONFIG_SERVICE_KEY,
          chainsAdapter.setAll(chainsInitialState, [chain]),
        ),
      )
      const chainsRefetch = store.dispatch(
        apiSliceWithChainsConfig.endpoints.getChainsConfigV2.initiate(CONFIG_SERVICE_KEY, { forceRefetch: true }),
      )

      const startedAt = Date.now()
      const overviewsQuery = store.dispatch(
        gatewayApi.endpoints.getMultipleSafeOverviews.initiate({
          currency: 'usd',
          safes: [{ chainId: chain.chainId, address: fakerChecksummedAddress() }],
        }),
      )
      await overviewsQuery

      expect(Date.now() - startedAt).toBeLessThan(CHAINS_WAIT_CAP_MS / 2)
      expect(requests.map((params) => params.get('trusted'))).toEqual(['true'])
      overviewsQuery.unsubscribe()
      chainsRefetch.unsubscribe()
    })

    it('waits for chain configs that are still loading and sends one request with their trusted value', async () => {
      const requests = recordSafesRequests()
      const chain = flaggedChain()
      serveChainsAfter(chain, SAFE_OVERVIEWS_BATCH_WINDOW_MS)

      await requestWhileChainsLoad(chain)

      expect(requests.map((params) => params.get('trusted'))).toEqual(['true'])
    })

    describe('with slow chain configs', () => {
      beforeEach(() => {
        jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] })
      })

      afterEach(() => {
        jest.useRealTimers()
      })

      const requestAfter = async (chain: Chain, ms: number) => {
        const elapsed = requestWhileChainsLoad(chain)
        await jest.advanceTimersByTimeAsync(ms)
        return elapsed
      }

      it('waits for chain configs that take a few seconds and sends their trusted value', async () => {
        const requests = recordSafesRequests()
        const chain = flaggedChain()
        const chainsDelay = 3_000
        serveChainsAfter(chain, chainsDelay)

        await requestAfter(chain, chainsDelay + SAFE_OVERVIEWS_BATCH_WINDOW_MS)

        expect(requests.map((params) => params.get('trusted'))).toEqual(['true'])
      })

      it('sends one request with trusted=false when the chain configs hang past the cap', async () => {
        const requests = recordSafesRequests()
        const chain = flaggedChain()
        serveChainsAfter(chain, CHAINS_WAIT_CAP_MS * 2)

        const elapsed = await requestAfter(chain, CHAINS_WAIT_CAP_MS + SAFE_OVERVIEWS_BATCH_WINDOW_MS)

        expect(elapsed).toBeLessThan(CHAINS_WAIT_CAP_MS * 2)
        expect(requests.map((params) => params.get('trusted'))).toEqual(['false'])
      })
    })
  })
})
