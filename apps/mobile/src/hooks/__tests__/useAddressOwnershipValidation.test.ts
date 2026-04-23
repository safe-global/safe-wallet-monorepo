import { renderHook, createTestStore, renderHookWithStore, type TestStore } from '../../tests/test-utils'
import { useAddressOwnershipValidation } from '../useAddressOwnershipValidation'
import { server } from '../../tests/server'
import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { CONFIG_SERVICE_KEY, GATEWAY_URL } from '@/src/config/constants'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'
import { act } from '@testing-library/react-native'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

describe('useAddressOwnershipValidation', () => {
  const mockLogger = require('@/src/utils/logger').default
  let mockAddress: `0x${string}`
  let mockSafeAddress: `0x${string}`
  let mockChainId: string
  let mockCurrency: string
  let mockOwners: { value: string; name?: string; logoUri?: string }[]

  beforeEach(() => {
    jest.clearAllMocks()
    server.resetHandlers()

    mockAddress = faker.finance.ethereumAddress() as `0x${string}`
    mockSafeAddress = faker.finance.ethereumAddress() as `0x${string}`
    mockChainId = '1'
    mockCurrency = 'usd'
    const secondAddress = faker.finance.ethereumAddress() as `0x${string}`
    mockOwners = [
      { value: mockAddress, name: faker.person.fullName(), logoUri: faker.image.url() },
      { value: secondAddress },
    ]
  })

  afterEach(() => {
    server.resetHandlers()
  })

  const createPendingSafeOverview = (chainId: string, owners = mockOwners): SafeOverview => ({
    address: { value: mockSafeAddress, name: null, logoUri: null },
    chainId,
    threshold: 1,
    owners,
    fiatTotal: '0',
    queued: 0,
    awaitingConfirmation: null,
  })

  const createStoreWithChains = async (pendingSafeAddress: string = mockSafeAddress): Promise<TestStore> => {
    const store = createTestStore({
      signerImportFlow: { pendingSafe: { address: pendingSafeAddress, name: 'Test Safe' } },
      settings: { currency: mockCurrency },
    })
    await store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfigV2.initiate(CONFIG_SERVICE_KEY))
    return store
  }

  it('returns false without fetching when no data is provided', async () => {
    const { result } = renderHook(() => useAddressOwnershipValidation())

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({ isOwner: false })
  })

  it('validates single safe ownership successfully using activeSafe', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, () => {
        return HttpResponse.json({ owners: mockOwners })
      }),
    )

    const { result } = renderHook(() => useAddressOwnershipValidation(), {
      activeSafe: { address: mockSafeAddress, chainId: mockChainId },
      settings: { currency: mockCurrency },
    })

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({
      isOwner: true,
      ownerInfo: mockOwners[0],
    })
  })

  it('returns false for single safe when not owner', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, () => {
        return HttpResponse.json({ owners: mockOwners.slice(1) })
      }),
    )

    const { result } = renderHook(() => useAddressOwnershipValidation(), {
      activeSafe: { address: mockSafeAddress, chainId: mockChainId },
      settings: { currency: mockCurrency },
    })

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({ isOwner: false })
  })

  it('validates multiple safes when pendingSafe present and address is owner', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v2/safes`, () => {
        return HttpResponse.json([
          createPendingSafeOverview('1'),
          createPendingSafeOverview('137', mockOwners.slice(1)),
        ])
      }),
    )

    const store = await createStoreWithChains()
    const { result } = renderHookWithStore(() => useAddressOwnershipValidation(), store)

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({
      isOwner: true,
      ownerInfo: mockOwners[0],
    })
  })

  it('returns false for multiple safes when pendingSafe present but address is not owner', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v2/safes`, () => {
        return HttpResponse.json([createPendingSafeOverview('1', mockOwners.slice(1))])
      }),
    )

    const store = await createStoreWithChains()
    const { result } = renderHookWithStore(() => useAddressOwnershipValidation(), store)

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({ isOwner: false })
  })

  it('returns false when pendingSafe is not deployed on any chain (empty overviews)', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v2/safes`, () => {
        return HttpResponse.json([])
      }),
    )

    const store = await createStoreWithChains()
    const { result } = renderHookWithStore(() => useAddressOwnershipValidation(), store)

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({ isOwner: false })
  })

  it('pendingSafe takes precedence over activeSafe', async () => {
    const pendingSafeAddress = faker.finance.ethereumAddress() as `0x${string}`

    server.use(
      http.get(`${GATEWAY_URL}/v2/safes`, () => {
        return HttpResponse.json([
          {
            address: { value: pendingSafeAddress, name: null, logoUri: null },
            chainId: '1',
            threshold: 1,
            owners: mockOwners,
            fiatTotal: '0',
            queued: 0,
            awaitingConfirmation: null,
          } satisfies SafeOverview,
        ])
      }),
    )

    const store = createTestStore({
      activeSafe: { address: mockSafeAddress, chainId: mockChainId },
      signerImportFlow: { pendingSafe: { address: pendingSafeAddress, name: 'Pending Safe' } },
      settings: { currency: mockCurrency },
    })
    await store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfigV2.initiate(CONFIG_SERVICE_KEY))
    const { result } = renderHookWithStore(() => useAddressOwnershipValidation(), store)

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({
      isOwner: true,
      ownerInfo: mockOwners[0],
    })
  })

  it('returns false when no safes data', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, () => {
        return HttpResponse.json(null)
      }),
    )

    const { result } = renderHook(() => useAddressOwnershipValidation(), {
      activeSafe: { address: mockSafeAddress, chainId: mockChainId },
      settings: { currency: mockCurrency },
    })

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({ isOwner: false })
  })

  it('handles fetch error gracefully', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, () => {
        return new Response('Internal Server Error', { status: 500 })
      }),
    )

    const { result } = renderHook(() => useAddressOwnershipValidation(), {
      activeSafe: { address: mockSafeAddress, chainId: mockChainId },
      settings: { currency: mockCurrency },
    })

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({ isOwner: false })
    expect(mockLogger.error).toHaveBeenCalled()
  })
})
