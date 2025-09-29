import { renderHook, renderHookWithStore, createTestStore } from '../../tests/test-utils'
import { useAddressOwnershipValidation } from '../useAddressOwnershipValidation'
import { server } from '../../tests/server'
import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { GATEWAY_URL } from '@/src/config/constants'
import { makeSafeId } from '@/src/utils/formatters'
import { extractSignersFromSafes } from '@/src/features/ImportReadOnly/helpers/safes'
import { act } from '@testing-library/react-native'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'

jest.mock('expo-router', () => ({
  useGlobalSearchParams: jest.fn(() => ({})),
}))

describe('useAddressOwnershipValidation', () => {
  const mockUseGlobalSearchParams = require('expo-router').useGlobalSearchParams
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

    mockUseGlobalSearchParams.mockReturnValue({})
  })

  afterEach(() => {
    server.resetHandlers()
  })

  it('returns false without fetching when no data is provided', async () => {
    const { result } = renderHook(() => useAddressOwnershipValidation())

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({ isOwner: false })
  })

  it('validates single safe ownership successfully', async () => {
    mockUseGlobalSearchParams.mockReturnValue({ safeAddress: mockSafeAddress, chainId: mockChainId })

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, () => {
        return HttpResponse.json({ owners: mockOwners })
      }),
    )

    const { result } = renderHook(() => useAddressOwnershipValidation(), { settings: { currency: mockCurrency } })

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
    mockUseGlobalSearchParams.mockReturnValue({ safeAddress: mockSafeAddress, chainId: mockChainId })

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, () => {
        return HttpResponse.json({ owners: mockOwners.slice(1) })
      }),
    )

    const { result } = renderHook(() => useAddressOwnershipValidation(), { settings: { currency: mockCurrency } })

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({ isOwner: false })
  })

  it('uses activeSafe when glob params missing', async () => {
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

  it('validates multiple safes when import_safe present', async () => {
    mockUseGlobalSearchParams.mockReturnValue({ import_safe: 'true', safeAddress: mockSafeAddress })

    const mockChainIds = ['1', '137', '42161']
    const mockSafes = mockChainIds.map((id) => makeSafeId(id, mockSafeAddress))
    const mockSafesData = [
      {
        address: { value: mockSafeAddress },
        chainId: '1',
        threshold: 1,
        owners: mockOwners,
        fiatTotal: '0',
        queued: 0,
        awaitingConfirmation: 0,
      },
      {
        address: { value: mockSafeAddress },
        chainId: '137',
        threshold: 1,
        owners: [mockOwners[1]],
        fiatTotal: '0',
        queued: 0,
        awaitingConfirmation: 0,
      },
    ]

    server.use(
      http.get(`${GATEWAY_URL}/v1/safes`, ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('safes')).toBe(mockSafes.join(','))
        expect(url.searchParams.get('currency')).toBe(mockCurrency)
        expect(url.searchParams.get('trusted')).toBe('true')
        expect(url.searchParams.get('exclude_spam')).toBe('true')

        return HttpResponse.json(mockSafesData)
      }),
    )

    const store = createTestStore({ settings: { currency: mockCurrency } })

    await act(async () => {
      await store.dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfig.initiate())
    })

    const { result } = renderHookWithStore(() => useAddressOwnershipValidation(), store)

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    const expectedOwners = extractSignersFromSafes(mockSafesData)
    const expectedInfo = Object.values(expectedOwners).find((o) => o.value.toLowerCase() === mockAddress.toLowerCase())

    expect(validationResult).toEqual({
      isOwner: true,
      ownerInfo: expectedInfo,
    })
  })

  it('returns false when no safes data', async () => {
    mockUseGlobalSearchParams.mockReturnValue({ safeAddress: mockSafeAddress, chainId: mockChainId })

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, () => {
        return HttpResponse.json(null)
      }),
    )

    const { result } = renderHook(() => useAddressOwnershipValidation(), { settings: { currency: mockCurrency } })

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({ isOwner: false })
  })

  it('handles fetch error gracefully', async () => {
    mockUseGlobalSearchParams.mockReturnValue({ safeAddress: mockSafeAddress, chainId: mockChainId })

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, () => {
        return new Response('Internal Server Error', { status: 500 })
      }),
    )

    const { result } = renderHook(() => useAddressOwnershipValidation(), { settings: { currency: mockCurrency } })

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({ isOwner: false })
    expect(mockLogger.error).toHaveBeenCalled()
  })
})
