import { renderHook, waitFor } from '@/tests/test-utils'
import { useGetMultipleSafeOverviewsQuery, useGetSafeOverviewQuery } from '../api/gateway'
import { faker } from '@faker-js/faker'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { additionalSafesRtkApi } from '@safe-global/store/gateway/safes'

const mockedInitiate = jest.spyOn(additionalSafesRtkApi.endpoints.safesGetOverviewForMany, 'initiate')

mockedInitiate.mockImplementation(jest.fn())

type SafesInitiateThunk = ReturnType<typeof additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate>
type SafesQueryActionResult = ReturnType<SafesInitiateThunk>

const mockQueryAction = ({ data = [], error }: { data?: SafeOverview[]; error?: unknown }) => {
  const queryResult = {
    unwrap: error ? jest.fn().mockRejectedValue(error) : jest.fn().mockResolvedValue(data),
    unsubscribe: jest.fn(),
  } as unknown as SafesQueryActionResult

  mockedInitiate.mockImplementationOnce(() => {
    const thunk = (() => queryResult) as SafesInitiateThunk
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
        excludeSpam: true,
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

    it('Should return an error if fetching fails', async () => {
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
        expect(result.current.error).toBeDefined()
        expect(result.current.data).toBeUndefined()
        expect(result.current.isLoading).toBeFalsy()
      })
    })

    it('Should call store endpoint with all safes', async () => {
      // Requests overviews for 15 Safes at once
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
        excludeSpam: true,
        walletAddress: undefined,
      })
    })
  })
})
