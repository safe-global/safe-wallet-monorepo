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
      // Promise.allSettled ensures partial successes are preserved
      expect(mockedInitiateV1).toHaveBeenCalled()
      expect(mockedInitiateV2).toHaveBeenCalled()
      expect(result.current.error).toBeUndefined()
      expect(result.current.data).toEqual([mockOverview2])
    })

    it('should handle v2 failure independently from v1', async () => {
      // Chain 1 uses v1 (will succeed), Chain 10 uses v2 (will fail)
      mockChainsConfig(['10'])

      const request = {
        currency: 'usd',
        safes: [
          {
            address: faker.finance.ethereumAddress(),
            chainId: '1', // v1 - will succeed
            isReadOnly: false,
            isPinned: false,
            lastVisited: 0,
            name: undefined,
          },
          {
            address: faker.finance.ethereumAddress(),
            chainId: '10', // v2 - will fail
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

      // v1 succeeds, v2 fails
      mockQueryAction({ data: [mockOverview1] })
      mockV2QueryAction({ error: new Error('V2 endpoint unavailable') })

      const { result } = renderHook(() => useGetMultipleSafeOverviewsQuery(request))

      await waitFor(() => {
        expect(result.current.isLoading).toBeFalsy()
      })

      // v1 safe should still be returned despite v2 failure
      // Promise.allSettled ensures partial successes are preserved
      expect(mockedInitiateV1).toHaveBeenCalled()
      expect(mockedInitiateV2).toHaveBeenCalled()
      expect(result.current.error).toBeUndefined()
      expect(result.current.data).toEqual([mockOverview1])
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
      expect(mockedInitiateV1).not.toHaveBeenCalled()

      // Advance timers past the 300ms batching window
      jest.advanceTimersByTime(350)

      await waitFor(() => {
        expect(result1.current.isLoading).toBeFalsy()
        expect(result2.current.isLoading).toBeFalsy()
      })

      // API should have been called only once with both safes batched
      expect(mockedInitiateV1).toHaveBeenCalledTimes(1)
      expect(mockedInitiateV1).toHaveBeenCalledWith(
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
      expect(mockedInitiateV1).not.toHaveBeenCalled()

      // At 350ms (past 300ms), should have fetched
      jest.advanceTimersByTime(150)

      await waitFor(() => {
        expect(mockedInitiateV1).toHaveBeenCalled()
      })
    })
  })
})
