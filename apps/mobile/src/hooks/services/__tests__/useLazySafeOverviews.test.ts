import { useLazySafeOverviews } from '../useLazySafeOverviews'
import { createTestStore, renderHook, renderHookWithStore, act } from '@/src/tests/test-utils'
import { server } from '@/src/tests/server'
import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { GATEWAY_URL } from '@/src/config/constants'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

describe('useLazySafeOverviews', () => {
  beforeEach(() => {
    server.resetHandlers()
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('uppercases currency before dispatching the underlying query', async () => {
    let requestedCurrency: string | undefined
    const safeAddress = faker.finance.ethereumAddress() as `0x${string}`
    const mockOverview: SafeOverview = {
      address: { value: safeAddress, name: null, logoUri: null },
      chainId: '1',
      threshold: 1,
      owners: [],
      fiatTotal: '0',
      queued: 0,
      awaitingConfirmation: null,
    }
    server.use(
      http.get(`${GATEWAY_URL}/v2/safes`, ({ request }) => {
        requestedCurrency = new URL(request.url).searchParams.get('currency') ?? undefined
        return HttpResponse.json([mockOverview])
      }),
    )

    const { result } = renderHook(() => useLazySafeOverviews())

    await act(async () => {
      const [trigger] = result.current
      await trigger({ safes: [`1:${safeAddress}`], currency: 'usd', trusted: true }).unwrap()
    })

    expect(requestedCurrency).toBe('USD')
  })

  // This test pins the reference-stability contract that makes the wrapper safe to use
  // inside `useCallback` deps and inside hooks like `useImportSafe` that debounce the trigger.
  // Without it, re-rendering consumers would recreate the trigger every render and cause
  // infinite re-render loops (observed as OOM during development).
  //
  // NOTE: use `renderHookWithStore` with a fixed store — `renderHook` from test-utils
  // builds a fresh store on every render, which would itself invalidate the trigger ref.
  it('returns a stable trigger reference across re-renders', () => {
    const store = createTestStore()
    const { result, rerender } = renderHookWithStore(() => useLazySafeOverviews(), store)
    const [firstTrigger] = result.current

    rerender(undefined)
    const [secondTrigger] = result.current

    expect(secondTrigger).toBe(firstTrigger)
  })
})
