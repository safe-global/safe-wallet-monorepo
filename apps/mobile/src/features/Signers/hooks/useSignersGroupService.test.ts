import { renderHook, waitFor } from '@/src/tests/test-utils'
import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { server } from '@/src/tests/server'
import { GATEWAY_URL } from '@/src/config/constants'
import { useSignersGroupService, groupSigners } from './useSignersGroupService'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { generateChecksummedAddress } from '@safe-global/test'

const createMockAddressInfo = (overrides: Partial<AddressInfo> = {}): AddressInfo => ({
  value: generateChecksummedAddress(),
  name: faker.person.fullName(),
  logoUri: faker.image.url(),
  ...overrides,
})

describe('groupSigners', () => {
  it('returns empty object when owners is undefined', () => {
    const result = groupSigners(undefined, {})
    expect(result).toEqual({})
  })

  it('groups imported signers correctly', () => {
    const owner1 = createMockAddressInfo()
    const owner2 = createMockAddressInfo()
    const appSigners = {
      [owner1.value]: owner1,
    }

    const result = groupSigners([owner1, owner2], appSigners)

    expect(result.imported.data).toHaveLength(1)
    expect(result.imported.data[0]).toEqual(owner1)
    expect(result.notImported.data).toHaveLength(1)
    expect(result.notImported.data[0]).toEqual(owner2)
  })

  it('puts all owners in notImported when no app signers match', () => {
    const owner1 = createMockAddressInfo()
    const owner2 = createMockAddressInfo()

    const result = groupSigners([owner1, owner2], {})

    expect(result.imported.data).toHaveLength(0)
    expect(result.notImported.data).toHaveLength(2)
  })

  it('puts all owners in imported when all match app signers', () => {
    const owner1 = createMockAddressInfo()
    const owner2 = createMockAddressInfo()
    const appSigners = {
      [owner1.value]: owner1,
      [owner2.value]: owner2,
    }

    const result = groupSigners([owner1, owner2], appSigners)

    expect(result.imported.data).toHaveLength(2)
    expect(result.notImported.data).toHaveLength(0)
  })

  it('returns empty arrays for both groups when owners array is empty', () => {
    const result = groupSigners([], {})

    expect(result.imported.data).toHaveLength(0)
    expect(result.notImported.data).toHaveLength(0)
  })

  it('preserves group metadata', () => {
    const owner = createMockAddressInfo()

    const result = groupSigners([owner], {})

    expect(result.imported.id).toBe('imported_signers')
    expect(result.imported.title).toBe('My signers')
    expect(result.notImported.id).toBe('not_imported_signers')
    expect(result.notImported.title).toBe('Not imported signers')
  })

  it('does not mutate the original groupedSigners constant', () => {
    const owner = createMockAddressInfo()

    groupSigners([owner], {})
    const result2 = groupSigners([], {})

    expect(result2.imported.data).toHaveLength(0)
    expect(result2.notImported.data).toHaveLength(0)
  })
})

describe('useSignersGroupService', () => {
  const mockSafeAddress = generateChecksummedAddress()
  const mockChainId = '1'

  beforeEach(() => {
    server.resetHandlers()
  })

  it('returns empty group when safe has no owners', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, () => {
        return HttpResponse.json({ owners: [] })
      }),
    )

    const { result } = renderHook(() => useSignersGroupService(), {
      activeSafe: { address: mockSafeAddress, chainId: mockChainId },
    })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    expect(result.current.group.imported?.data).toHaveLength(0)
    expect(result.current.group.notImported?.data).toHaveLength(0)
  })

  it('groups owners as not imported when no signers in store', async () => {
    const owner1 = createMockAddressInfo()
    const owner2 = createMockAddressInfo()

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, () => {
        return HttpResponse.json({ owners: [owner1, owner2] })
      }),
    )

    const { result } = renderHook(() => useSignersGroupService(), {
      activeSafe: { address: mockSafeAddress, chainId: mockChainId },
    })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    expect(result.current.group.notImported?.data).toHaveLength(2)
    expect(result.current.group.imported?.data).toHaveLength(0)
  })

  it('groups owners as imported when signers exist in store', async () => {
    const owner1 = createMockAddressInfo()
    const owner2 = createMockAddressInfo()

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, () => {
        return HttpResponse.json({ owners: [owner1, owner2] })
      }),
    )

    const { result } = renderHook(() => useSignersGroupService(), {
      activeSafe: { address: mockSafeAddress, chainId: mockChainId },
      signers: { [owner1.value]: { ...owner1, type: 'private-key' as const } },
    })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    expect(result.current.group.imported?.data).toHaveLength(1)
    expect(result.current.group.imported?.data[0].value).toBe(owner1.value)
    expect(result.current.group.notImported?.data).toHaveLength(1)
    expect(result.current.group.notImported?.data[0].value).toBe(owner2.value)
  })

  it('indicates fetching state while loading', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json({ owners: [] })
      }),
    )

    const { result } = renderHook(() => useSignersGroupService(), {
      activeSafe: { address: mockSafeAddress, chainId: mockChainId },
    })

    expect(result.current.isFetching).toBe(true)

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })
  })

  it('updates group when signers in store change', async () => {
    const owner = createMockAddressInfo()

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/${mockChainId}/safes/${mockSafeAddress}`, () => {
        return HttpResponse.json({ owners: [owner] })
      }),
    )

    const { result } = renderHook(() => useSignersGroupService(), {
      activeSafe: { address: mockSafeAddress, chainId: mockChainId },
      signers: {},
    })

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false)
    })

    expect(result.current.group.notImported?.data).toHaveLength(1)
    expect(result.current.group.imported?.data).toHaveLength(0)
  })
})
