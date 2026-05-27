import { act, renderHook, waitFor } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import useInvalidateOverviewsOnTx from '../useInvalidateOverviewsOnTx'
import { useGetMultipleSafeOverviewsQuery } from '@/store/api/gateway'
import * as txEvents from '@/services/tx/txEvents'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import { additionalSafesRtkApi } from '@safe-global/store/gateway/safes'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

const mockedInitiate = jest.spyOn(additionalSafesRtkApi.endpoints.safesGetOverviewForMany, 'initiate')

type InitiateThunk = ReturnType<typeof additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate>
type QueryActionResult = ReturnType<InitiateThunk>

const mockQueryAction = (data: SafeOverview[]) => {
  const queryResult = {
    unwrap: jest.fn().mockResolvedValue(data),
    unsubscribe: jest.fn(),
  } as unknown as QueryActionResult

  mockedInitiate.mockImplementationOnce(() => (() => queryResult) as InitiateThunk)
}

const makeOverview = (address: string, fiatTotal: string): SafeOverview =>
  ({
    address: { value: address },
    chainId: '1',
    awaitingConfirmation: null,
    fiatTotal,
    owners: [{ value: faker.finance.ethereumAddress() }],
    threshold: 1,
    queued: 0,
  }) as unknown as SafeOverview

const txDetail = { txId: '0x1', nonce: 1, chainId: '1', safeAddress: faker.finance.ethereumAddress() }

describe('useInvalidateOverviewsOnTx', () => {
  beforeEach(() => {
    mockedInitiate.mockReset()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('refetches Safe overviews when a tx is executed', async () => {
    const safe = {
      address: faker.finance.ethereumAddress(),
      chainId: '1',
      isReadOnly: false,
      isPinned: false,
      lastVisited: 0,
      name: undefined,
    }
    const request = { currency: 'usd', safes: [safe] }
    const stale = makeOverview(safe.address, '100')
    const fresh = makeOverview(safe.address, '200')

    mockQueryAction([stale])

    const { result } = renderHook(() => {
      useInvalidateOverviewsOnTx()
      return useGetMultipleSafeOverviewsQuery(request)
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([stale])
    })
    expect(mockedInitiate).toHaveBeenCalledTimes(1)

    // A tx is executed -> overviews must be refetched and the fresh balance shown
    mockQueryAction([fresh])
    act(() => {
      txDispatch(TxEvent.SUCCESS, txDetail)
    })

    await waitFor(() => {
      expect(mockedInitiate).toHaveBeenCalledTimes(2)
      expect(result.current.data).toEqual([fresh])
    })
  })

  it('subscribes to tx success and unsubscribes on unmount', () => {
    const unsubscribe = jest.fn()
    const subscribeSpy = jest.spyOn(txEvents, 'txSubscribe').mockReturnValue(unsubscribe)

    const { unmount } = renderHook(() => useInvalidateOverviewsOnTx())

    expect(subscribeSpy).toHaveBeenCalledWith(TxEvent.SUCCESS, expect.any(Function))
    expect(unsubscribe).not.toHaveBeenCalled()

    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })
})
