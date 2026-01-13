import { renderHook, waitFor } from '@/tests/test-utils'
import { useGetMultipleSafeOverviewsQuery, useGetSafeOverviewQuery } from '../api/gateway'
import { faker } from '@faker-js/faker'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { additionalSafesRtkApi, additionalSafesRtkApiV2 } from '@safe-global/store/gateway/safes'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'

// Mock v1 endpoint
const mockedInitiateV1 = jest.spyOn(additionalSafesRtkApi.endpoints.safesGetOverviewForMany, 'initiate')
mockedInitiateV1.mockImplementation(jest.fn())

// Mock v2 endpoint
const mockedInitiateV2 = jest.spyOn(additionalSafesRtkApiV2.endpoints.safesGetOverviewForManyV2, 'initiate')
mockedInitiateV2.mockImplementation(jest.fn())

// Mock chains config selector
const mockedChainsSelect = jest.spyOn(apiSliceWithChainsConfig.endpoints.getChainsConfig, 'select')

// Keep backward compatibility alias
const mockedInitiate = mockedInitiateV1

type SafesV1InitiateThunk = ReturnType<typeof additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate>
type SafesV1QueryActionResult = ReturnType<SafesV1InitiateThunk>

type SafesV2InitiateThunk = ReturnType<typeof additionalSafesRtkApiV2.endpoints.safesGetOverviewForManyV2.initiate>
type SafesV2QueryActionResult = ReturnType<SafesV2InitiateThunk>

const mockQueryAction = ({ data = [], error }: { data?: SafeOverview[]; error?: unknown }) => {
  const queryResult = {
    unwrap: error ? jest.fn().mockRejectedValue(error) : jest.fn().mockResolvedValue(data),
    unsubscribe: jest.fn(),
  } as unknown as SafesV1QueryActionResult

  mockedInitiateV1.mockImplementationOnce(() => {
    const thunk = (() => queryResult) as SafesV1InitiateThunk
    return thunk
  })

  return queryResult
}

const mockV2QueryAction = ({ data = [], error }: { data?: SafeOverview[]; error?: unknown }) => {
  const queryResult = {
    unwrap: error ? jest.fn().mockRejectedValue(error) : jest.fn().mockResolvedValue(data),
    unsubscribe: jest.fn(),
  } as unknown as SafesV2QueryActionResult

  mockedInitiateV2.mockImplementationOnce(() => {
    const thunk = (() => queryResult) as SafesV2InitiateThunk
    return thunk
  })

  return queryResult
}

/**
 * Mock chains config to enable PORTFOLIO_ENDPOINT feature for specific chains
 */
const mockChainsConfig = (v2ChainIds: string[]) => {
  const entities: Record<string, unknown> = {}

  // Add chains with v2 feature enabled
  v2ChainIds.forEach((chainId) => {
    entities[chainId] = {
      chainId,
      features: [FEATURES.PORTFOLIO_ENDPOINT],
    }
  })

  mockedChainsSelect.mockReturnValue(
    () =>
      ({
        data: { entities, ids: Object.keys(entities) },
      }) as never,
  )
}

describe('safeOverviews', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedInitiateV1.mockReset()
    mockedInitiateV2.mockReset()
    mockedChainsSelect.mockReset()
    // Default: no chains have v2 enabled
    mockChainsConfig([])
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

  describe('v2 endpoint routing', () => {
    it('should use v2 endpoint when PORTFOLIO_ENDPOINT feature is enabled for a chain', async () => {
      const fakeSafeAddress = faker.finance.ethereumAddress()
      const request = { chainId: '1', safeAddress: fakeSafeAddress }

      // Enable v2 for chain 1
      mockChainsConfig(['1'])

      const mockOverview = {
        address: { value: request.safeAddress },
        chainId: '1',
        awaitingConfirmation: null,
        fiatTotal: '100',
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
        queued: 0,
      }

      mockV2QueryAction({ data: [mockOverview] })

      const { result } = renderHook(() => useGetSafeOverviewQuery(request))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.data).toEqual(mockOverview)
      })

      // Should call v2 endpoint, not v1
      expect(mockedInitiateV2).toHaveBeenCalledWith({
        safes: [`1:${fakeSafeAddress}`],
        currency: 'usd',
        trusted: false,
        excludeSpam: true,
        walletAddress: undefined,
      })
      expect(mockedInitiateV1).not.toHaveBeenCalled()
    })

    it('should use v1 endpoint when PORTFOLIO_ENDPOINT feature is not enabled', async () => {
      const fakeSafeAddress = faker.finance.ethereumAddress()
      const request = { chainId: '1', safeAddress: fakeSafeAddress }

      // No chains have v2 enabled (default)
      mockChainsConfig([])

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

      // Should call v1 endpoint, not v2
      expect(mockedInitiateV1).toHaveBeenCalled()
      expect(mockedInitiateV2).not.toHaveBeenCalled()
    })

    it('should route safes to correct endpoints based on chain feature flags', async () => {
      // Chain 1 uses v1, Chain 10 uses v2
      mockChainsConfig(['10'])

      const request = {
        currency: 'usd',
        safes: [
          {
            address: faker.finance.ethereumAddress(),
            chainId: '1', // v1
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          },
          {
            address: faker.finance.ethereumAddress(),
            chainId: '10', // v2
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

      // Mock both endpoints
      mockQueryAction({ data: [mockOverview1] })
      mockV2QueryAction({ data: [mockOverview2] })

      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery(request))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
        expect(result.current.error).toBeUndefined()
      })

      // Both endpoints should have been called
      expect(mockedInitiateV1).toHaveBeenCalledWith({
        safes: [`1:${request.safes[0].address}`],
        currency: 'usd',
        trusted: false,
        excludeSpam: true,
        walletAddress: undefined,
      })
      expect(mockedInitiateV2).toHaveBeenCalledWith({
        safes: [`10:${request.safes[1].address}`],
        currency: 'usd',
        trusted: false,
        excludeSpam: true,
        walletAddress: undefined,
      })
    })

    it('should handle v1 failure independently from v2', async () => {
      // Chain 1 uses v1 (will fail), Chain 10 uses v2 (will succeed)
      mockChainsConfig(['10'])

      const request = {
        currency: 'usd',
        safes: [
          {
            address: faker.finance.ethereumAddress(),
            chainId: '1', // v1 - will fail
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          },
          {
            address: faker.finance.ethereumAddress(),
            chainId: '10', // v2 - will succeed
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          },
        ],
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

      // v1 fails, v2 succeeds
      mockQueryAction({ error: new Error('V1 endpoint unavailable') })
      mockV2QueryAction({ data: [mockOverview2] })

      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery(request))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
      })

      // v2 safe should still be returned despite v1 failure
      // The error will be caught at the Promise.all level for individual safes
      expect(mockedInitiateV1).toHaveBeenCalled()
      expect(mockedInitiateV2).toHaveBeenCalled()
    })
  })
})
