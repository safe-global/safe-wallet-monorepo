import { http, HttpResponse } from 'msw'
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
})
