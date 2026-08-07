import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { gatewayApi, makeSafeOverviewTag, useGetMultipleSafeOverviewsQuery } from '../api/gateway'
import { useAppDispatch } from '@/store'

/**
 * Integration test (no mocking of the inner safesGetOverviewForMany query) that guards the
 * forceRefetch behaviour: invalidating the overview cache must issue a real, fresh /v2/safes
 * request rather than returning the still-warm inner cache. Dropping forceRefetch would make
 * the inner initiate dedupe against that cache and silently reintroduce WA-2348.
 */
describe('safeOverviews cache invalidation (integration)', () => {
  it('fetches fresh overviews from the network when the SafeOverviews tag is invalidated', async () => {
    const safeAddress = faker.finance.ethereumAddress()
    let requestCount = 0

    server.use(
      http.get(`${GATEWAY_URL}/v2/safes`, () => {
        requestCount += 1
        return HttpResponse.json([
          {
            address: { value: safeAddress },
            chainId: '1',
            awaitingConfirmation: null,
            fiatTotal: requestCount === 1 ? '100' : '200',
            owners: [{ value: faker.finance.ethereumAddress() }],
            threshold: 1,
            queued: 0,
          },
        ])
      }),
    )

    const request = {
      currency: 'usd',
      safes: [
        { address: safeAddress, chainId: '1', isReadOnly: false, isPinned: false, lastVisited: 0, name: undefined },
      ],
    }

    const { result } = renderHook(() => ({
      dispatch: useAppDispatch(),
      query: useGetMultipleSafeOverviewsQuery(request),
    }))

    await waitFor(
      () => {
        expect(result.current.query.data?.[0]?.fiatTotal).toBe('100')
      },
      { timeout: 2000 },
    )
    expect(requestCount).toBe(1)

    // A transaction invalidates this Safe's overview tag -> a fresh network request must follow
    act(() => {
      result.current.dispatch(
        gatewayApi.util.invalidateTags([{ type: 'SafeOverviews', id: makeSafeOverviewTag('1', safeAddress) }]),
      )
    })

    await waitFor(
      () => {
        expect(requestCount).toBe(2)
        expect(result.current.query.data?.[0]?.fiatTotal).toBe('200')
      },
      { timeout: 2000 },
    )
  })
})
