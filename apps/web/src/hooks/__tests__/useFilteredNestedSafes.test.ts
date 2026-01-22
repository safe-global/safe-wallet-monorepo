import { renderHook, waitFor, act } from '@/tests/test-utils'
import { useFilteredNestedSafes } from '../useFilteredNestedSafes'
import { faker } from '@faker-js/faker'
import { addressExBuilder, extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import type { RootState } from '@/store'

// Increase timeout for all tests in this file due to async RTK Query operations
jest.setTimeout(15000)

describe('useFilteredNestedSafes', () => {
  const parentSafeAddress = checksumAddress(faker.finance.ethereumAddress())
  const parentDeployer = checksumAddress(faker.finance.ethereumAddress())
  const owner1 = checksumAddress(faker.finance.ethereumAddress())
  const owner2 = checksumAddress(faker.finance.ethereumAddress())
  const chainId = '1'

  const mockSafe = extendedSafeInfoBuilder()
    .with({ address: { value: parentSafeAddress, name: null, logoUri: null } })
    .with({ chainId })
    .with({
      owners: [addressExBuilder().with({ value: owner1 }).build(), addressExBuilder().with({ value: owner2 }).build()],
    })
    .build()

  const initialReduxState: Partial<RootState> = {
    safeInfo: {
      loading: false,
      error: undefined,
      data: mockSafe,
      loaded: true,
    },
  }

  const mockCreationResponse = (creator: string) => ({
    created: '2024-01-01T00:00:00Z',
    creator,
    transactionHash: '0x' + faker.string.hexadecimal({ length: 64 }),
    factoryAddress: checksumAddress(faker.finance.ethereumAddress()),
    masterCopy: null,
    setupData: null,
    saltNonce: null,
    dataDecoded: null,
  })

  beforeEach(() => {
    // Default: mock parent safe creation
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/creation`, ({ params }) => {
        if (params.safeAddress === parentSafeAddress) {
          return HttpResponse.json(mockCreationResponse(parentDeployer))
        }
        return HttpResponse.json(null, { status: 404 })
      }),
    )
  })

  it('should return empty array when no nested safes', async () => {
    const { result } = renderHook(() => useFilteredNestedSafes([], chainId), { initialReduxState })

    expect(result.current.nestedSafes).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasStarted).toBe(false)
  })

  it('should not fetch creation data until startFiltering is called', async () => {
    const nestedSafe1 = checksumAddress(faker.finance.ethereumAddress())
    let apiCalled = false

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/creation`, ({ params }) => {
        if (params.safeAddress === nestedSafe1) {
          apiCalled = true
        }
        return HttpResponse.json(mockCreationResponse(owner1))
      }),
    )

    renderHook(() => useFilteredNestedSafes([nestedSafe1], chainId), { initialReduxState })

    // Wait a bit to ensure no API calls were made
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(apiCalled).toBe(false)
  })

  it('should mark Safes deployed by parent owners as valid', async () => {
    const nestedSafe1 = checksumAddress(faker.finance.ethereumAddress())
    const nestedSafe2 = checksumAddress(faker.finance.ethereumAddress())
    const unknownDeployer = checksumAddress(faker.finance.ethereumAddress())

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/creation`, ({ params }) => {
        if (params.safeAddress === parentSafeAddress) {
          return HttpResponse.json(mockCreationResponse(parentDeployer))
        }
        if (params.safeAddress === nestedSafe1) {
          return HttpResponse.json(mockCreationResponse(owner1))
        }
        if (params.safeAddress === nestedSafe2) {
          return HttpResponse.json(mockCreationResponse(unknownDeployer))
        }
        return HttpResponse.json(null, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useFilteredNestedSafes([nestedSafe1, nestedSafe2], chainId), {
      initialReduxState,
    })

    // Start filtering inside act
    await act(async () => {
      result.current.startFiltering()
    })

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 10000 },
    )

    // Should return both safes with appropriate isValid status
    expect(result.current.nestedSafes).toHaveLength(2)
    // Valid safe should come first (sorted)
    expect(result.current.nestedSafes[0]).toEqual({ address: nestedSafe1, isValid: true })
    expect(result.current.nestedSafes[1]).toEqual({ address: nestedSafe2, isValid: false })
  })

  it('should mark Safes deployed by parent Safe itself as valid', async () => {
    const nestedSafe1 = checksumAddress(faker.finance.ethereumAddress())

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/creation`, ({ params }) => {
        if (params.safeAddress === parentSafeAddress) {
          return HttpResponse.json(mockCreationResponse(parentDeployer))
        }
        if (params.safeAddress === nestedSafe1) {
          return HttpResponse.json(mockCreationResponse(parentSafeAddress))
        }
        return HttpResponse.json(null, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useFilteredNestedSafes([nestedSafe1], chainId), { initialReduxState })

    await act(async () => {
      result.current.startFiltering()
    })

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 10000 },
    )

    expect(result.current.nestedSafes).toEqual([{ address: nestedSafe1, isValid: true }])
  })

  it('should mark Safes deployed by parent deployer as valid', async () => {
    const nestedSafe1 = checksumAddress(faker.finance.ethereumAddress())

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/creation`, ({ params }) => {
        if (params.safeAddress === parentSafeAddress) {
          return HttpResponse.json(mockCreationResponse(parentDeployer))
        }
        if (params.safeAddress === nestedSafe1) {
          return HttpResponse.json(mockCreationResponse(parentDeployer))
        }
        return HttpResponse.json(null, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useFilteredNestedSafes([nestedSafe1], chainId), { initialReduxState })

    await act(async () => {
      result.current.startFiltering()
    })

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 10000 },
    )

    expect(result.current.nestedSafes).toEqual([{ address: nestedSafe1, isValid: true }])
  })

  it('should mark Safes where creation data cannot be fetched as invalid', async () => {
    const nestedSafe1 = checksumAddress(faker.finance.ethereumAddress())
    const nestedSafe2 = checksumAddress(faker.finance.ethereumAddress())

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/creation`, ({ params }) => {
        if (params.safeAddress === parentSafeAddress) {
          return HttpResponse.json(mockCreationResponse(parentDeployer))
        }
        if (params.safeAddress === nestedSafe1) {
          return HttpResponse.json(mockCreationResponse(owner1))
        }
        if (params.safeAddress === nestedSafe2) {
          // Return 404 for this Safe
          return HttpResponse.json(null, { status: 404 })
        }
        return HttpResponse.json(null, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useFilteredNestedSafes([nestedSafe1, nestedSafe2], chainId), {
      initialReduxState,
    })

    await act(async () => {
      result.current.startFiltering()
    })

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 10000 },
    )

    // Both safes should be returned, nestedSafe2 as invalid
    expect(result.current.nestedSafes).toHaveLength(2)
    expect(result.current.nestedSafes[0]).toEqual({ address: nestedSafe1, isValid: true })
    expect(result.current.nestedSafes[1]).toEqual({ address: nestedSafe2, isValid: false })
  })

  it('should handle case-insensitive address comparison', async () => {
    const nestedSafe1 = checksumAddress(faker.finance.ethereumAddress())

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/creation`, ({ params }) => {
        if (params.safeAddress === parentSafeAddress) {
          return HttpResponse.json(mockCreationResponse(parentDeployer))
        }
        if (params.safeAddress === nestedSafe1) {
          // Return owner1 address in lowercase
          return HttpResponse.json(mockCreationResponse(owner1.toLowerCase()))
        }
        return HttpResponse.json(null, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useFilteredNestedSafes([nestedSafe1], chainId), { initialReduxState })

    await act(async () => {
      result.current.startFiltering()
    })

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 10000 },
    )

    expect(result.current.nestedSafes).toEqual([{ address: nestedSafe1, isValid: true }])
  })

  it('should limit to 10 nested Safes', async () => {
    const nestedSafes = Array.from({ length: 15 }, () => checksumAddress(faker.finance.ethereumAddress()))
    let apiCallCount = 0

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/creation`, ({ params }) => {
        if (params.safeAddress === parentSafeAddress) {
          return HttpResponse.json(mockCreationResponse(parentDeployer))
        }
        if (nestedSafes.includes(params.safeAddress as string)) {
          apiCallCount++
          return HttpResponse.json(mockCreationResponse(owner1))
        }
        return HttpResponse.json(null, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useFilteredNestedSafes(nestedSafes, chainId), { initialReduxState })

    await act(async () => {
      result.current.startFiltering()
    })

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 10000 },
    )

    // Should only check 10 nested safes
    expect(apiCallCount).toBe(10)
    expect(result.current.nestedSafes).toHaveLength(10)
  })

  it('should set hasStarted to true after calling startFiltering', async () => {
    const nestedSafe1 = checksumAddress(faker.finance.ethereumAddress())

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/creation`, ({ params }) => {
        if (params.safeAddress === parentSafeAddress) {
          return HttpResponse.json(mockCreationResponse(parentDeployer))
        }
        return HttpResponse.json(mockCreationResponse(owner1))
      }),
    )

    const { result } = renderHook(() => useFilteredNestedSafes([nestedSafe1], chainId), { initialReduxState })

    expect(result.current.hasStarted).toBe(false)

    await act(async () => {
      result.current.startFiltering()
    })

    expect(result.current.hasStarted).toBe(true)
  })

  it('should sort valid Safes before invalid ones', async () => {
    const validSafe = checksumAddress(faker.finance.ethereumAddress())
    const invalidSafe1 = checksumAddress(faker.finance.ethereumAddress())
    const invalidSafe2 = checksumAddress(faker.finance.ethereumAddress())
    const unknownDeployer = checksumAddress(faker.finance.ethereumAddress())

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/creation`, ({ params }) => {
        if (params.safeAddress === parentSafeAddress) {
          return HttpResponse.json(mockCreationResponse(parentDeployer))
        }
        if (params.safeAddress === validSafe) {
          return HttpResponse.json(mockCreationResponse(owner1))
        }
        return HttpResponse.json(mockCreationResponse(unknownDeployer))
      }),
    )

    // Pass invalid safes first to verify sorting works
    const { result } = renderHook(() => useFilteredNestedSafes([invalidSafe1, validSafe, invalidSafe2], chainId), {
      initialReduxState,
    })

    await act(async () => {
      result.current.startFiltering()
    })

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false)
      },
      { timeout: 10000 },
    )

    // Valid safe should come first after sorting
    expect(result.current.nestedSafes).toHaveLength(3)
    expect(result.current.nestedSafes[0]).toEqual({ address: validSafe, isValid: true })
    expect(result.current.nestedSafes[1].isValid).toBe(false)
    expect(result.current.nestedSafes[2].isValid).toBe(false)
  })
})
