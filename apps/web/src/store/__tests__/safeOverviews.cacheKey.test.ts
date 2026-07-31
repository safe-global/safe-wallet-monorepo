import { faker } from '@faker-js/faker'
import { makeStore } from '@/store'
import { gatewayApi } from '../api/gateway'
import { additionalSafesRtkApi } from '@safe-global/store/gateway/safes'
import type { SafeItem } from '@/hooks/safes'

// Neutralize the inner batched fetch so the (timer-driven) network call never runs; this test only
// inspects the OUTER getMultipleSafeOverviews cache key, which is created synchronously on dispatch.
const mockedInitiate = jest.spyOn(additionalSafesRtkApi.endpoints.safesGetOverviewForMany, 'initiate')

type Store = ReturnType<typeof makeStore>

const overviewKeys = (store: Store): string[] =>
  Object.keys(store.getState().gatewayApi.queries ?? {}).filter((key) => key.startsWith('getMultipleSafeOverviews('))

const fullSafeItem = (chainId: string, address: string, isReadOnly: boolean): SafeItem => ({
  chainId,
  address,
  isReadOnly,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

describe('getMultipleSafeOverviews cache key (serializeQueryArgs)', () => {
  const ADDR_A = faker.finance.ethereumAddress()
  const ADDR_B = faker.finance.ethereumAddress()

  beforeEach(() => {
    // Cache keys are created synchronously on dispatch; fake timers keep the batched fetcher's 300ms
    // timer from firing (and leaking) after the assertions — this test never resolves the fetch.
    jest.useFakeTimers()
    mockedInitiate.mockReset()
    mockedInitiate.mockImplementation(jest.fn())
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  it('shares ONE entry for the same safe set regardless of field values, order, and isReadOnly flips', () => {
    const store = makeStore(undefined, { skipBroadcast: true })

    // Dashboard-style: full SafeItems, in order [A, B], all writable.
    store.dispatch(
      gatewayApi.endpoints.getMultipleSafeOverviews.initiate({
        currency: 'usd',
        safes: [fullSafeItem('1', ADDR_A, false), fullSafeItem('10', ADDR_B, false)],
      }),
    )

    // Ownership-style: minimal {chainId,address} refs, reversed order [B, A].
    store.dispatch(
      gatewayApi.endpoints.getMultipleSafeOverviews.initiate({
        currency: 'usd',
        safes: [
          { chainId: '10', address: ADDR_B },
          { chainId: '1', address: ADDR_A },
        ],
      }),
    )

    // The very same set but with isReadOnly flipped to true. Without the normalized cache key this
    // would re-key and create a duplicate fetch.
    store.dispatch(
      gatewayApi.endpoints.getMultipleSafeOverviews.initiate({
        currency: 'usd',
        safes: [fullSafeItem('1', ADDR_A, true), fullSafeItem('10', ADDR_B, true)],
      }),
    )

    expect(overviewKeys(store)).toHaveLength(1)
  })

  it('keeps distinct entries for a different safe set and for wallet-scoped subscriptions', () => {
    const store = makeStore(undefined, { skipBroadcast: true })
    const fullSet = [fullSafeItem('1', ADDR_A, false), fullSafeItem('10', ADDR_B, false)]

    // No-wallet entry for the full set {A, B}.
    store.dispatch(gatewayApi.endpoints.getMultipleSafeOverviews.initiate({ currency: 'usd', safes: fullSet }))

    // Subset {A} → different set → distinct entry.
    store.dispatch(
      gatewayApi.endpoints.getMultipleSafeOverviews.initiate({
        currency: 'usd',
        safes: [fullSafeItem('1', ADDR_A, false)],
      }),
    )

    // Wallet-scoped entry for the same full set → walletAddress retained in the key → distinct entry.
    store.dispatch(
      gatewayApi.endpoints.getMultipleSafeOverviews.initiate({
        currency: 'usd',
        walletAddress: faker.finance.ethereumAddress(),
        safes: fullSet,
      }),
    )

    expect(overviewKeys(store)).toHaveLength(3)
  })
})
