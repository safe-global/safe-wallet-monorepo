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

const makeSafeItem = (address: string) => ({
  address,
  chainId: '1',
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

describe('useInvalidateOverviewsOnTx', () => {
  beforeEach(() => {
    mockedInitiate.mockReset()
  })

  it('refetches the overviews of the Safe that executed the tx', async () => {
    const safeAddress = faker.finance.ethereumAddress()
    const request = { currency: 'usd', safes: [makeSafeItem(safeAddress)] }
    const stale = makeOverview(safeAddress, '100')
    const fresh = makeOverview(safeAddress, '200')

    mockQueryAction([stale])

    const { result } = renderHook(() => {
      useInvalidateOverviewsOnTx()
      return useGetMultipleSafeOverviewsQuery(request)
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([stale])
    })
    expect(mockedInitiate).toHaveBeenCalledTimes(1)

    // tx executed on this Safe -> its overviews must be refetched and the fresh balance shown
    mockQueryAction([fresh])
    act(() => {
      txDispatch(TxEvent.SUCCESS, { txId: '0x1', nonce: 1, chainId: '1', safeAddress })
    })

    await waitFor(() => {
      expect(mockedInitiate).toHaveBeenCalledTimes(2)
      expect(result.current.data).toEqual([fresh])
    })
  })

  it('does not refetch overviews of an unrelated Safe', async () => {
    const safeAddress = faker.finance.ethereumAddress()
    const request = { currency: 'usd', safes: [makeSafeItem(safeAddress)] }

    mockQueryAction([makeOverview(safeAddress, '100')])

    const { result } = renderHook(() => {
      useInvalidateOverviewsOnTx()
      return useGetMultipleSafeOverviewsQuery(request)
    })

    await waitFor(() => {
      expect(result.current.data?.[0]?.fiatTotal).toBe('100')
    })
    expect(mockedInitiate).toHaveBeenCalledTimes(1)

    // tx executed on a different Safe -> this query must not refetch
    act(() => {
      txDispatch(TxEvent.SUCCESS, {
        txId: '0x2',
        nonce: 1,
        chainId: '1',
        safeAddress: faker.finance.ethereumAddress(),
      })
    })

    // wait past the 300ms batching window to be sure no fetch was scheduled
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(mockedInitiate).toHaveBeenCalledTimes(1)
  })

  it('subscribes to tx success and unsubscribes on unmount', () => {
    const unsubscribe = jest.fn()
    const subscribeSpy = jest.spyOn(txEvents, 'txSubscribe').mockReturnValue(unsubscribe)

    const { unmount } = renderHook(() => useInvalidateOverviewsOnTx())

    expect(subscribeSpy).toHaveBeenCalledWith(TxEvent.SUCCESS, expect.any(Function))
    expect(unsubscribe).not.toHaveBeenCalled()

    unmount()
    expect(unsubscribe).toHaveBeenCalledTimes(1)

    subscribeSpy.mockRestore()
  })
})
