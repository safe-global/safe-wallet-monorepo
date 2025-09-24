import { act, renderHook, waitFor } from '@/tests/test-utils'
import { useGetMultipleSafeOverviewsQuery, useGetSafeOverviewQuery } from '../api/gateway'
import { faker } from '@faker-js/faker'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { additionalSafesRtkApi } from '@safe-global/store/gateway/safes'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'

const initiateSpy = jest.spyOn(additionalSafesRtkApi.endpoints.safesGetOverviewForMany, 'initiate')

type MockQueryResponse = {
  unwrap: jest.Mock
  unsubscribe: jest.Mock
}

const createMockQueryResponse = (response?: { data?: SafeOverview[]; error?: unknown }): MockQueryResponse => {
  const unwrap = jest.fn()

  if (response?.error) {
    unwrap.mockRejectedValue(response.error)
  } else {
    unwrap.mockResolvedValue(response?.data ?? [])
  }

  return {
    unwrap,
    unsubscribe: jest.fn(),
  }
}

const mockInitiateOnce = (response?: { data?: SafeOverview[]; error?: unknown }): MockQueryResponse => {
  const mockResponse = createMockQueryResponse(response)
  initiateSpy.mockImplementationOnce(() => () => mockResponse as any)
  return mockResponse
}

describe('safeOverviews queries', () => {
  beforeEach(() => {
    initiateSpy.mockReset()
  })

  afterAll(() => {
    initiateSpy.mockRestore()
  })

  describe('useGetSafeOverviewQuery', () => {
    it('returns null when no safe address is provided', async () => {
      const { result } = renderHook(() => useGetSafeOverviewQuery({ chainId: '1', safeAddress: '' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.data).toBeNull()
        expect(result.current.error).toBeUndefined()
      })

      expect(initiateSpy).not.toHaveBeenCalled()
    })

    it('returns an error when the request fails', async () => {
      const error = new Error('Service unavailable')
      const mockResponse = mockInitiateOnce({ error })
      const request = { chainId: '1', safeAddress: faker.finance.ethereumAddress() }

      const { result } = renderHook(() => useGetSafeOverviewQuery(request))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.error).toBeDefined()
      })

      expect(mockResponse.unsubscribe).toHaveBeenCalled()
      expect(initiateSpy).toHaveBeenCalledTimes(1)
    })

    it('returns null when the Safe overview is not found', async () => {
      const mockResponse = mockInitiateOnce({ data: [] })
      const request = { chainId: '1', safeAddress: faker.finance.ethereumAddress() }

      const { result } = renderHook(() => useGetSafeOverviewQuery(request))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.data).toBeNull()
        expect(result.current.error).toBeUndefined()
      })

      expect(mockResponse.unsubscribe).toHaveBeenCalled()
    })

    it('returns the Safe overview when available and forwards query params', async () => {
      const safeAddress = faker.finance.ethereumAddress()
      const walletAddress = faker.finance.ethereumAddress()
      const overview: SafeOverview = {
        address: { value: safeAddress },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: '100',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      const mockResponse = mockInitiateOnce({ data: [overview] })

      const { result } = renderHook(() => useGetSafeOverviewQuery({ chainId: '1', safeAddress, walletAddress }))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.data).toEqual(overview)
      })

      expect(mockResponse.unsubscribe).toHaveBeenCalled()
      expect(initiateSpy).toHaveBeenCalledTimes(1)

      const [queryArgs, options] = initiateSpy.mock.calls[0]
      expect(queryArgs).toEqual({
        safes: [`1:${safeAddress}`],
        currency: 'usd',
        walletAddress,
        trusted: false,
        excludeSpam: true,
      })
      expect(options).toEqual({ subscribe: false })
    })

    it('batches concurrent overview requests with matching currency and wallet', async () => {
      const walletAddress = faker.finance.ethereumAddress()
      const safeAddressOne = faker.finance.ethereumAddress()
      const safeAddressTwo = faker.finance.ethereumAddress()

      const overviewOne: SafeOverview = {
        address: { value: safeAddressOne },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: '25',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      const overviewTwo: SafeOverview = {
        address: { value: safeAddressTwo },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: '75',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      const mockResponse = mockInitiateOnce({ data: [overviewOne, overviewTwo] })

      const useCombinedOverviews = () => {
        const first = useGetSafeOverviewQuery({ chainId: '1', safeAddress: safeAddressOne, walletAddress })
        const second = useGetSafeOverviewQuery({ chainId: '1', safeAddress: safeAddressTwo, walletAddress })

        return [first, second] as const
      }

      const { result } = renderHook(() => useCombinedOverviews())

      await waitFor(() => {
        const [first, second] = result.current
        expect(first.data).toEqual(overviewOne)
        expect(second.data).toEqual(overviewTwo)
      })

      expect(initiateSpy).toHaveBeenCalledTimes(1)
      expect(mockResponse.unsubscribe).toHaveBeenCalled()
    })

    it('dispatches a single query when ten Safe overviews are requested together', async () => {
      const walletAddress = faker.finance.ethereumAddress()
      const requests = Array.from({ length: 10 }, (_, index) => ({
        chainId: String(index + 1),
        safeAddress: faker.finance.ethereumAddress(),
      }))

      const overviews: SafeOverview[] = requests.map((request) => ({
        address: { value: request.safeAddress },
        chainId: request.chainId,
        awaitingConfirmation: null,
        fiatTotal: faker.string.numeric({ length: { min: 1, max: 6 } }),
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }))

      const mockResponse = mockInitiateOnce({ data: overviews })

      const [request0, request1, request2, request3, request4, request5, request6, request7, request8, request9] =
        requests

      const useTenSafeOverviews = () => {
        const query0 = useGetSafeOverviewQuery({
          chainId: request0.chainId,
          safeAddress: request0.safeAddress,
          walletAddress,
        })
        const query1 = useGetSafeOverviewQuery({
          chainId: request1.chainId,
          safeAddress: request1.safeAddress,
          walletAddress,
        })
        const query2 = useGetSafeOverviewQuery({
          chainId: request2.chainId,
          safeAddress: request2.safeAddress,
          walletAddress,
        })
        const query3 = useGetSafeOverviewQuery({
          chainId: request3.chainId,
          safeAddress: request3.safeAddress,
          walletAddress,
        })
        const query4 = useGetSafeOverviewQuery({
          chainId: request4.chainId,
          safeAddress: request4.safeAddress,
          walletAddress,
        })
        const query5 = useGetSafeOverviewQuery({
          chainId: request5.chainId,
          safeAddress: request5.safeAddress,
          walletAddress,
        })
        const query6 = useGetSafeOverviewQuery({
          chainId: request6.chainId,
          safeAddress: request6.safeAddress,
          walletAddress,
        })
        const query7 = useGetSafeOverviewQuery({
          chainId: request7.chainId,
          safeAddress: request7.safeAddress,
          walletAddress,
        })
        const query8 = useGetSafeOverviewQuery({
          chainId: request8.chainId,
          safeAddress: request8.safeAddress,
          walletAddress,
        })
        const query9 = useGetSafeOverviewQuery({
          chainId: request9.chainId,
          safeAddress: request9.safeAddress,
          walletAddress,
        })

        return [query0, query1, query2, query3, query4, query5, query6, query7, query8, query9] as const
      }

      const { result, unmount } = renderHook(() => useTenSafeOverviews())

      await waitFor(() => {
        result.current.forEach((query, index) => {
          expect(query.data).toEqual(overviews[index])
        })
      })

      expect(initiateSpy).toHaveBeenCalledTimes(1)
      expect(mockResponse.unsubscribe).toHaveBeenCalled()

      const [queryArgs, options] = initiateSpy.mock.calls[0]
      expect(queryArgs).toEqual({
        safes: requests.map((request) => `${request.chainId}:${request.safeAddress}`),
        currency: 'usd',
        walletAddress,
        trusted: false,
        excludeSpam: true,
      })
      expect(options).toEqual({ subscribe: false })

      unmount()
    })
  })

  describe('useGetMultipleSafeOverviewsQuery', () => {
    const buildSafeItem = (chainId: string, address: string): SafeItem => ({
      address,
      chainId,
      isPinned: false,
      isReadOnly: false,
      lastVisited: 0,
      name: undefined,
    })

    it('returns an empty array when no safes are provided', async () => {
      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery({ safes: [], currency: 'usd' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.data).toEqual([])
      })

      expect(initiateSpy).not.toHaveBeenCalled()
    })

    it('returns an error when the request fails', async () => {
      const safes = [
        buildSafeItem('1', faker.finance.ethereumAddress()),
        buildSafeItem('1', faker.finance.ethereumAddress()),
      ]
      const error = new Error('Not available')
      const mockResponse = mockInitiateOnce({ error })

      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery({ safes, currency: 'usd' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.error).toBeDefined()
      })

      expect(mockResponse.unsubscribe).toHaveBeenCalled()
      expect(initiateSpy).toHaveBeenCalledTimes(1)
    })

    it('returns the Safe overviews when available', async () => {
      const safe1 = buildSafeItem('1', faker.finance.ethereumAddress())
      const safe2 = buildSafeItem('5', faker.finance.ethereumAddress())
      const safes = [safe1, safe2]

      const overview1: SafeOverview = {
        address: { value: safe1.address },
        chainId: safe1.chainId,
        awaitingConfirmation: null,
        fiatTotal: '50',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      const overview2: SafeOverview = {
        address: { value: safe2.address },
        chainId: safe2.chainId,
        awaitingConfirmation: null,
        fiatTotal: '150',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      const unrelatedOverview: SafeOverview = {
        address: { value: faker.finance.ethereumAddress() },
        chainId: '10',
        awaitingConfirmation: null,
        fiatTotal: '0',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      const mockResponse = mockInitiateOnce({ data: [overview1, overview2, unrelatedOverview] })

      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery({ safes, currency: 'usd' }))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.data).toEqual([overview1, overview2])
      })

      expect(mockResponse.unsubscribe).toHaveBeenCalled()
      expect(initiateSpy).toHaveBeenCalledTimes(1)
    })

    it('forwards currency and wallet address to the query', async () => {
      const safes = [
        buildSafeItem('1', faker.finance.ethereumAddress()),
        buildSafeItem('1', faker.finance.ethereumAddress()),
      ]
      const walletAddress = faker.finance.ethereumAddress()
      const currency = 'eur'
      const mockResponse = mockInitiateOnce({ data: [] })

      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery({ safes, currency, walletAddress }))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.data).toEqual([])
      })

      expect(mockResponse.unsubscribe).toHaveBeenCalled()

      const [queryArgs, options] = initiateSpy.mock.calls[0]
      expect(queryArgs).toEqual({
        safes: safes.map((safe) => `${safe.chainId}:${safe.address}`),
        currency,
        walletAddress,
        trusted: false,
        excludeSpam: true,
      })
      expect(options).toEqual({ subscribe: false })
    })

    it('splits large batches into sequential queries of ten Safes', async () => {
      jest.useFakeTimers()

      try {
        const safes = Array.from({ length: 15 }, () => buildSafeItem('1', faker.finance.ethereumAddress()))
        const walletAddress = faker.finance.ethereumAddress()

        const firstBatch: SafeOverview[] = safes.slice(0, 10).map((safe) => ({
          address: { value: safe.address },
          chainId: safe.chainId,
          awaitingConfirmation: null,
          fiatTotal: faker.string.numeric({ length: { min: 1, max: 6 } }),
          owners: [{ value: faker.finance.ethereumAddress() }],
          threshold: 1,
          queued: 0,
        }))

        const secondBatch: SafeOverview[] = safes.slice(10).map((safe) => ({
          address: { value: safe.address },
          chainId: safe.chainId,
          awaitingConfirmation: null,
          fiatTotal: faker.string.numeric({ length: { min: 1, max: 6 } }),
          owners: [{ value: faker.finance.ethereumAddress() }],
          threshold: 1,
          queued: 0,
        }))

        const firstResponse = mockInitiateOnce({ data: firstBatch })
        const secondResponse = mockInitiateOnce({ data: secondBatch })

        const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery({ safes, currency: 'usd', walletAddress }))

        await act(async () => {
          jest.runOnlyPendingTimers()
          await Promise.resolve()
        })

        await waitFor(() => {
          expect(result.current.isLoading).toBeFalsy()
          expect(result.current.data).toEqual([...firstBatch, ...secondBatch])
        })

        expect(initiateSpy).toHaveBeenCalledTimes(2)
        expect(firstResponse.unsubscribe).toHaveBeenCalled()
        expect(secondResponse.unsubscribe).toHaveBeenCalled()

        const [firstArgs] = initiateSpy.mock.calls[0]
        expect(firstArgs).toEqual({
          safes: safes.slice(0, 10).map((safe) => `${safe.chainId}:${safe.address}`),
          currency: 'usd',
          walletAddress,
          trusted: false,
          excludeSpam: true,
        })

        const [secondArgs] = initiateSpy.mock.calls[1]
        expect(secondArgs).toEqual({
          safes: safes.slice(10).map((safe) => `${safe.chainId}:${safe.address}`),
          currency: 'usd',
          walletAddress,
          trusted: false,
          excludeSpam: true,
        })
      } finally {
        jest.useRealTimers()
      }
    })
  })
})
