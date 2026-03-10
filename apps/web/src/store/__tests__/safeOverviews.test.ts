import { renderHook, waitFor } from '@/tests/test-utils'
import { useGetMultipleSafeOverviewsQuery, useGetSafeOverviewQuery } from '../api/gateway'
import { faker } from '@faker-js/faker'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { additionalSafesRtkApi } from '@safe-global/store/gateway/safes'

const mockedInitiate = jest.spyOn(additionalSafesRtkApi.endpoints.safesGetOverviewForMany, 'initiate')
mockedInitiate.mockImplementation(jest.fn())

type InitiateThunk = ReturnType<typeof additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate>
type QueryActionResult = ReturnType<InitiateThunk>

const mockQueryAction = ({ data = [], error }: { data?: SafeOverview[]; error?: unknown }) => {
  const queryResult = {
    unwrap: error ? jest.fn().mockRejectedValue(error) : jest.fn().mockResolvedValue(data),
    unsubscribe: jest.fn(),
  } as unknown as QueryActionResult

  mockedInitiate.mockImplementationOnce(() => {
    const thunk = (() => queryResult) as InitiateThunk
    return thunk
  })

  return queryResult
}

describe('safeOverviews', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedInitiate.mockReset()
  })

  describe('useGetSafeOverviewQuery', () => {
    it('should return null for empty safe Address', async () => {
      const request = { chainId: '1', safeAddress: '' }
      const { result } = renderHook(() => useGetSafeOverviewQuery(request))

      // Request should get queued and remain loading for the queue seconds
      expect(result.current.isLoading).toBeTruthy()

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.error).toBeUndefined()
        expect(result.current.data).toBeNull()
      })

      expect(mockedInitiate).not.toHaveBeenCalled()
    })

    it('should return an error if fetching fails', async () => {
      const request = { chainId: '1', safeAddress: faker.finance.ethereumAddress() }
      mockQueryAction({ error: new Error('Service unavailable') })

      const { result } = renderHook(() => useGetSafeOverviewQuery(request))

      // Request should get queued and remain loading for the queue seconds
      expect(result.current.isLoading).toBeTruthy()

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.error).toBeDefined()
        expect(result.current.data).toBeUndefined()
      })
    })

    it('should return null if safeOverview is not found for a given Safe', async () => {
      const request = { chainId: '1', safeAddress: faker.finance.ethereumAddress() }
      mockQueryAction({ data: [] })

      const { result } = renderHook(() => useGetSafeOverviewQuery(request))

      // Request should get queued and remain loading for the queue seconds
      expect(result.current.isLoading).toBeTruthy()

      await Promise.resolve()

      await waitFor(() => {
        expect(mockedInitiate).toHaveBeenCalled()
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.error).toBeUndefined()
        expect(result.current.data).toEqual(null)
      })
    })

    it('should return the Safe overview if fetching is successful', async () => {
      const request = { chainId: '1', safeAddress: faker.finance.ethereumAddress() }

      const mockOverview = {
        address: { value: request.safeAddress },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: '100',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }
      mockQueryAction({ data: [mockOverview] })

      const { result } = renderHook(() => useGetSafeOverviewQuery(request))

      // Request should get queued and remain loading for the queue seconds
      expect(result.current.isLoading).toBeTruthy()

      await Promise.resolve()

      await waitFor(() => {
        expect(mockedInitiate).toHaveBeenCalled()
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.error).toBeUndefined()
        expect(result.current.data).toEqual(mockOverview)
      })
    })

    it('should call store endpoint for each request', async () => {
      const fakeSafeAddress = faker.finance.ethereumAddress()
      const request = { chainId: '1', safeAddress: fakeSafeAddress }

      const mockOverview = {
        address: { value: request.safeAddress },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: '100',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      mockQueryAction({ data: [mockOverview] })

      const { result } = renderHook(() => useGetSafeOverviewQuery(request))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.data).toEqual(mockOverview)
      })

      // Should call the store endpoint with the safe ID
      expect(mockedInitiate).toHaveBeenCalledWith({
        safes: [`1:${fakeSafeAddress}`],
        currency: 'usd',
        trusted: false,
        walletAddress: undefined,
      })
    })
  })

  describe('useGetMultipleSafeOverviewsQuery', () => {
    it('Should return empty list for empty list of Safes', async () => {
      const request = { currency: 'usd', safes: [] }

      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery(request))

      // Request should get queued and remain loading for the queue seconds
      expect(result.current.isLoading).toBeTruthy()

      await Promise.resolve()
      await Promise.resolve()

      await Promise.resolve()
      await Promise.resolve()

      await waitFor(() => {
        expect(result.current.error).toBeUndefined()
        expect(result.current.data).toEqual([])
        expect(result.current.isLoading).toBeFalsy()
      })
    })

    it('Should return a response for non-empty list', async () => {
      const request = {
        currency: 'usd',
        safes: [
          {
            address: faker.finance.ethereumAddress(),
            chainId: '1',
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          },
          {
            address: faker.finance.ethereumAddress(),
            chainId: '10',
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          },
        ],
      }

      const mockOverview1 = {
        address: { value: request.safes[0].address },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: '100',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      const mockOverview2 = {
        address: { value: request.safes[1].address },
        chainId: '10',
        awaitingConfirmation: null,
        fiatTotal: '200',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 4,
      }

      mockQueryAction({ data: [mockOverview1, mockOverview2] })

      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery(request))

      // Request should get queued and remain loading for the queue seconds
      expect(result.current.isLoading).toBeTruthy()

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.error).toBeUndefined()
        expect(result.current.data).toEqual([mockOverview1, mockOverview2])
      })
    })

    it('Should return empty array when all fetches fail (graceful degradation)', async () => {
      const request = {
        currency: 'usd',
        safes: [
          {
            address: faker.finance.ethereumAddress(),
            chainId: '1',
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          },
          {
            address: faker.finance.ethereumAddress(),
            chainId: '10',
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          },
        ],
      }

      mockQueryAction({ error: new Error('Not available') })

      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery(request))

      // Request should get queued and remain loading for the queue seconds
      expect(result.current.isLoading).toBeTruthy()

      await waitFor(async () => {
        await Promise.resolve()
        // With Promise.allSettled, failed fetches result in empty array, not error
        // This allows partial successes when only some safes fail
        expect(result.current.error).toBeUndefined()
        expect(result.current.data).toEqual([])
        expect(result.current.isLoading).toBeFalsy()
      })
    })

    it('Should call store endpoint with all safes', async () => {
      // Requests overviews for 15 Safes at once
      const request = {
        currency: 'usd',
        safes: Array.from({ length: 15 }, () => ({
          address: faker.finance.ethereumAddress(),
          chainId: '1',
          isReadOnly: false,
          isPinned: false,
          lastVisited: 0,
          name: undefined,
        })),
      }

      const allOverviews = request.safes.map((safe) => ({
        address: { value: safe.address },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: faker.string.numeric({ length: { min: 1, max: 6 } }),
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }))

      // Mock the store endpoint to return all overviews at once
      // The store handles batching internally
      mockQueryAction({ data: allOverviews })

      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery(request))

      // Request should get queued and remain loading for the queue seconds
      expect(result.current.isLoading).toBeTruthy()

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.error).toBeUndefined()
        expect(result.current.data).toEqual(allOverviews)
      })

      // Should call the store endpoint once with all safes
      expect(mockedInitiate).toHaveBeenCalledWith({
        safes: request.safes.map((safe) => `1:${safe.address}`),
        currency: 'usd',
        trusted: false,
        walletAddress: undefined,
      })
    })

    it('should return only the safes that exist in the response (partial results)', async () => {
      // Request 3 safes, but API only returns 2
      const request = {
        currency: 'usd',
        safes: [
          {
            address: faker.finance.ethereumAddress(),
            chainId: '1',
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          },
          {
            address: faker.finance.ethereumAddress(),
            chainId: '1',
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          },
          {
            address: faker.finance.ethereumAddress(),
            chainId: '1',
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          },
        ],
      }

      // Only return overviews for the first two safes
      const mockOverview1 = {
        address: { value: request.safes[0].address },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: '100',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      const mockOverview2 = {
        address: { value: request.safes[1].address },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: '200',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      // API returns only 2 out of 3 requested safes
      mockQueryAction({ data: [mockOverview1, mockOverview2] })

      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery(request))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
      })

      // Should return only the 2 safes that were in the response
      expect(result.current.error).toBeUndefined()
      expect(result.current.data).toHaveLength(2)
      expect(result.current.data).toEqual([mockOverview1, mockOverview2])
    })

    it('should not match safe address on a different chain than requested', async () => {
      const safeAddress = faker.finance.ethereumAddress()
      const request = {
        currency: 'usd',
        safes: [
          {
            address: safeAddress,
            chainId: '1', // Requesting on chain 1
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          },
        ],
      }

      // API returns the safe but with a different chainId
      const mockOverviewWrongChain = {
        address: { value: safeAddress },
        chainId: '10', // Response says chain 10, not chain 1
        awaitingConfirmation: null,
        fiatTotal: '100',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      mockQueryAction({ data: [mockOverviewWrongChain] })

      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery(request))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
      })

      // Should not return the safe because the chainId doesn't match
      expect(result.current.error).toBeUndefined()
      expect(result.current.data).toEqual([])
    })
  })

  describe('batching behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should batch multiple requests within 300ms window', async () => {
      const request1 = { chainId: '1', safeAddress: faker.finance.ethereumAddress() }
      const request2 = { chainId: '1', safeAddress: faker.finance.ethereumAddress() }

      const mockOverview1 = {
        address: { value: request1.safeAddress },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: '100',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      const mockOverview2 = {
        address: { value: request2.safeAddress },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: '200',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      // Mock to return both overviews in a single call
      mockQueryAction({ data: [mockOverview1, mockOverview2] })

      // Render both hooks (simulating multiple components requesting overviews)
      const { result: result1 } = renderHook(() => useGetSafeOverviewQuery(request1))
      const { result: result2 } = renderHook(() => useGetSafeOverviewQuery(request2))

      // Both should be loading initially
      expect(result1.current.isLoading).toBeTruthy()
      expect(result2.current.isLoading).toBeTruthy()

      // API should not have been called yet (batching window not elapsed)
      expect(mockedInitiate).not.toHaveBeenCalled()

      // Advance timers past the 300ms batching window
      jest.advanceTimersByTime(350)

      await waitFor(() => {
        expect(result1.current.isLoading).toBeFalsy()
        expect(result2.current.isLoading).toBeFalsy()
      })

      // API should have been called only once with both safes batched
      expect(mockedInitiate).toHaveBeenCalledTimes(1)
      expect(mockedInitiate).toHaveBeenCalledWith(
        expect.objectContaining({
          safes: expect.arrayContaining([`1:${request1.safeAddress}`, `1:${request2.safeAddress}`]),
        }),
      )
    })

    it('should trigger fetch after 300ms timeout', async () => {
      const request = { chainId: '1', safeAddress: faker.finance.ethereumAddress() }

      const mockOverview = {
        address: { value: request.safeAddress },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: '100',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      mockQueryAction({ data: [mockOverview] })

      const { result } = renderHook(() => useGetSafeOverviewQuery(request))

      // Initially loading
      expect(result.current.isLoading).toBeTruthy()

      // At 200ms, should not have fetched yet
      jest.advanceTimersByTime(200)
      expect(mockedInitiate).not.toHaveBeenCalled()

      // At 350ms (past 300ms), should have fetched
      jest.advanceTimersByTime(150)

      await waitFor(() => {
        expect(mockedInitiate).toHaveBeenCalled()
      })
    })
  })
})
