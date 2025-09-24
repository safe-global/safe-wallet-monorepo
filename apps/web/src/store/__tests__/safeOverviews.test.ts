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
      jest.useFakeTimers()

      try {
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

        act(() => {
          jest.runOnlyPendingTimers()
        })

        await waitFor(() => {
          const [first, second] = result.current
          expect(first.data).toEqual(overviewOne)
          expect(second.data).toEqual(overviewTwo)
        })

        expect(initiateSpy).toHaveBeenCalledTimes(1)
        expect(mockResponse.unsubscribe).toHaveBeenCalled()
      } finally {
        jest.useRealTimers()
      }
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

      // Include an unrelated overview to ensure filtering works
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
  })
})
