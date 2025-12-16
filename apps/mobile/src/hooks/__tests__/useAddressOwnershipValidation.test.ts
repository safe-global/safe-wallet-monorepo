import { renderHook } from '../../tests/test-utils'
import { useAddressOwnershipValidation } from '../useAddressOwnershipValidation'
import { server } from '../../tests/server'
import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { GATEWAY_URL } from '@/src/config/constants'
import { act } from '@testing-library/react-native'

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
    const mockOwnedSafesResponse = {
      '1': [mockSafeAddress, faker.finance.ethereumAddress()],
      '137': [faker.finance.ethereumAddress()],
      '42161': [mockSafeAddress],
    }

    server.use(
      http.get(`${GATEWAY_URL}/v2/owners/${mockAddress}/safes`, () => {
        return HttpResponse.json(mockOwnedSafesResponse)
      }),
    )

    const { result } = renderHook(() => useAddressOwnershipValidation(), {
      signerImportFlow: { pendingSafe: { address: mockSafeAddress, name: 'Test Safe' } },
    })

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({
      isOwner: true,
      ownerInfo: { value: mockAddress },
    })
  })

  it('returns false for multiple safes when pendingSafe present but address is not owner', async () => {
    const mockOwnedSafesResponse = {
      '1': [faker.finance.ethereumAddress()],
      '137': [faker.finance.ethereumAddress()],
      '42161': [faker.finance.ethereumAddress()],
    }

    server.use(
      http.get(`${GATEWAY_URL}/v2/owners/${mockAddress}/safes`, () => {
        return HttpResponse.json(mockOwnedSafesResponse)
      }),
    )

    const { result } = renderHook(() => useAddressOwnershipValidation(), {
      signerImportFlow: { pendingSafe: { address: mockSafeAddress, name: 'Test Safe' } },
    })

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({
      isOwner: false,
    })
  })

  it('pendingSafe takes precedence over activeSafe', async () => {
    const pendingSafeAddress = faker.finance.ethereumAddress() as `0x${string}`

    const mockOwnedSafesResponse = {
      '1': [pendingSafeAddress],
    }

    server.use(
      http.get(`${GATEWAY_URL}/v2/owners/${mockAddress}/safes`, () => {
        return HttpResponse.json(mockOwnedSafesResponse)
      }),
    )

    const { result } = renderHook(() => useAddressOwnershipValidation(), {
      activeSafe: { address: mockSafeAddress, chainId: mockChainId },
      signerImportFlow: { pendingSafe: { address: pendingSafeAddress, name: 'Pending Safe' } },
    })

    let validationResult
    await act(async () => {
      validationResult = await result.current.validateAddressOwnership(mockAddress)
    })

    expect(validationResult).toEqual({
      isOwner: true,
      ownerInfo: { value: mockAddress },
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
