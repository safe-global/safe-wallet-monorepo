import { useSafeKnownChainsOverview } from '../useSafeKnownChainsOverview'
import { renderHook, waitFor } from '@/src/tests/test-utils'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { GATEWAY_URL } from '@/src/config/constants'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { Address } from '@/src/types/address'

const safeAddress = faker.finance.ethereumAddress() as Address

const buildOverview = (chainId: string): SafeOverview => ({
  address: { value: safeAddress, name: null, logoUri: null },
  chainId,
  threshold: 1,
  owners: [],
  fiatTotal: '0',
  queued: 0,
  awaitingConfirmation: null,
})

const storeWithKnownChains = (chainIds: string[]) => ({
  safes: {
    [safeAddress]: Object.fromEntries(chainIds.map((id) => [id, buildOverview(id)])),
  },
})

describe('useSafeKnownChainsOverview', () => {
  let safesParams: URLSearchParams[]

  beforeEach(() => {
    safesParams = []
    server.use(
      http.get(`${GATEWAY_URL}/v2/safes`, ({ request }) => {
        safesParams.push(new URL(request.url).searchParams)
        return HttpResponse.json([])
      }),
    )
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('fetches /v2/safes scoped to the safe’s known chains', async () => {
    renderHook(() => useSafeKnownChainsOverview(safeAddress), storeWithKnownChains(['1', '137']))

    await waitFor(() => expect(safesParams.length).toBeGreaterThan(0))

    const probedSafes = (safesParams[0].get('safes') ?? '').split(',')
    expect(probedSafes).toHaveLength(2)
    expect(probedSafes).toEqual(expect.arrayContaining([`1:${safeAddress}`, `137:${safeAddress}`]))
  })

  it('skips the request when safeAddress is undefined', () => {
    renderHook(() => useSafeKnownChainsOverview(undefined), storeWithKnownChains(['1']))

    // `skip: true` means RTK Query never dispatches an action, so the assertion is
    // safe to run synchronously immediately after mount.
    expect(safesParams).toHaveLength(0)
  })

  it('skips the request when the safe is not in the slice (no known chains)', () => {
    renderHook(() => useSafeKnownChainsOverview(safeAddress), { safes: {} })

    expect(safesParams).toHaveLength(0)
  })

  it('skips the request when the safe entry is present but has no known chains', () => {
    renderHook(() => useSafeKnownChainsOverview(safeAddress), storeWithKnownChains([]))

    expect(safesParams).toHaveLength(0)
  })
})
