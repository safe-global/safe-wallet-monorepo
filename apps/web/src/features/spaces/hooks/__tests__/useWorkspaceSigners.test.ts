import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { skipToken } from '@reduxjs/toolkit/query'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { toWorkspaceSigners, useWorkspaceSigners } from '../useWorkspaceSigners'

const mockUseSpaceSafesGetV1Query = jest.fn()
const mockUseGetMultipleSafeOverviewsQuery = jest.fn()
const mockUseSpaceAddressBookState = jest.fn()
let mockUndeployedSafes: Record<string, Record<string, { props: { safeAccountConfig: { owners: string[] } } }>> = {}

jest.mock('../useCurrentSpaceId', () => ({ useCurrentSpaceId: () => 'space-1' }))
jest.mock('../useGetSpaceAddressBook', () => ({
  useSpaceAddressBookState: () => mockUseSpaceAddressBookState(),
}))
jest.mock('@/store', () => ({
  useAppSelector: (selector: string) => {
    if (selector === 'isAuthenticated') return true
    if (selector === 'selectCurrency') return 'usd'
    if (selector === 'selectUndeployedSafes') return mockUndeployedSafes
    return undefined
  },
}))
jest.mock('@/store/authSlice', () => ({ isAuthenticated: 'isAuthenticated' }))
jest.mock('@/store/settingsSlice', () => ({ selectCurrency: 'selectCurrency' }))
jest.mock('@/store/slices', () => ({ selectUndeployedSafes: 'selectUndeployedSafes' }))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesGetV1Query: (...args: unknown[]) => mockUseSpaceSafesGetV1Query(...args),
}))
jest.mock('@/store/api/gateway', () => ({
  useGetMultipleSafeOverviewsQuery: (...args: unknown[]) => mockUseGetMultipleSafeOverviewsQuery(...args),
}))

const randomAddress = () => checksumAddress(faker.finance.ethereumAddress())

const buildOverview = (chainId: string, safe: string, owners: string[]): SafeOverview => ({
  address: { value: safe },
  chainId,
  threshold: 1,
  owners: owners.map((value) => ({ value })),
  fiatTotal: '0',
  queued: 0,
})

describe('toWorkspaceSigners', () => {
  it('lists each owner once with every chain it signs on', () => {
    const safeA = randomAddress()
    const safeB = randomAddress()
    const owner = randomAddress()

    const result = toWorkspaceSigners(
      [
        { chainId: '1', safeAddress: safeA, owners: [owner] },
        { chainId: '10', safeAddress: safeB, owners: [owner] },
        { chainId: '1', safeAddress: safeB, owners: [owner] },
      ],
      [],
    )

    expect(result).toHaveLength(1)
    expect(result[0].address).toBe(owner)
    expect(result[0].chainIds).toEqual(['1', '10'])
    expect(result[0].safes.map((safe) => safe.address)).toEqual([safeA, safeB])
  })

  it('keeps the lowest position when owner order differs between chains', () => {
    const safe = randomAddress()
    const owner = randomAddress()
    const other = randomAddress()

    const [signer] = toWorkspaceSigners(
      [
        { chainId: '1', safeAddress: safe, owners: [other, owner] },
        { chainId: '10', safeAddress: safe, owners: [owner, other] },
      ],
      [],
    )

    expect(signer.safes).toEqual([{ address: safe, name: undefined, position: 1 }])
  })

  it('names a Safe from the workspace book, case-insensitively', () => {
    const safe = randomAddress()
    const name = faker.company.name()

    const [signer] = toWorkspaceSigners(
      [{ chainId: '1', safeAddress: safe, owners: [randomAddress()] }],
      [{ address: safe.toLowerCase(), name }],
    )

    expect(signer.safes[0].name).toBe(name)
  })

  it('leaves name undefined for a Safe the book has no name for', () => {
    const safe = randomAddress()

    const [signer] = toWorkspaceSigners(
      [{ chainId: '1', safeAddress: safe, owners: [randomAddress()] }],
      [{ address: randomAddress(), name: faker.company.name() }],
    )

    expect(signer.safes[0].name).toBeUndefined()
  })

  it('treats the same Safe address in different casing as one Safe', () => {
    const safe = randomAddress()
    const owner = randomAddress()

    const [signer] = toWorkspaceSigners(
      [
        { chainId: '1', safeAddress: safe, owners: [owner] },
        { chainId: '10', safeAddress: safe.toLowerCase(), owners: [owner.toLowerCase()] },
      ],
      [],
    )

    expect(signer.safes).toHaveLength(1)
    expect(signer.chainIds).toEqual(['1', '10'])
  })
})

describe('useWorkspaceSigners', () => {
  const refetchSafes = jest.fn()
  const refetchBook = jest.fn()

  const mockSafes = (safes: Record<string, string[]> | undefined, state = {}) =>
    mockUseSpaceSafesGetV1Query.mockReturnValue({
      currentData: safes && { safes },
      isLoading: false,
      isError: false,
      refetch: refetchSafes,
      ...state,
    })

  beforeEach(() => {
    jest.clearAllMocks()
    mockUndeployedSafes = {}
    mockUseGetMultipleSafeOverviewsQuery.mockReturnValue({ data: [], isLoading: false, isError: false })
    mockUseSpaceAddressBookState.mockReturnValue({ items: [], isLoading: false, isError: false, refetch: refetchBook })
    mockSafes({})
  })

  it('skips a Safe whose overview is missing and keeps the others', () => {
    const safeA = randomAddress()
    const safeB = randomAddress()
    const owner = randomAddress()
    mockSafes({ '1': [safeA, safeB] })
    mockUseGetMultipleSafeOverviewsQuery.mockReturnValue({
      data: [buildOverview('1', safeA, [owner])],
      isLoading: false,
      isError: false,
    })

    const { result } = renderHook(() => useWorkspaceSigners())

    expect(mockUseGetMultipleSafeOverviewsQuery).toHaveBeenCalledWith({
      safes: [
        { chainId: '1', address: safeA },
        { chainId: '1', address: safeB },
      ],
      currency: 'usd',
    })
    expect(result.current.signers).toHaveLength(1)
    expect(result.current.signers[0].safes.map((safe) => safe.address)).toEqual([safeA])
  })

  it('reads owners of an undeployed workspace Safe from the local counterfactual config', () => {
    const safe = randomAddress()
    const owner = randomAddress()
    mockSafes({ '1': [safe] })
    mockUndeployedSafes = { '1': { [safe]: { props: { safeAccountConfig: { owners: [owner] } } } } }

    const { result } = renderHook(() => useWorkspaceSigners())

    expect(result.current.signers).toEqual([
      { address: owner, chainIds: ['1'], safes: [{ address: safe, name: undefined, position: 1 }] },
    ])
  })

  it('skips the overview query when the workspace has no Safes', () => {
    renderHook(() => useWorkspaceSigners())

    expect(mockUseGetMultipleSafeOverviewsQuery).toHaveBeenCalledWith(skipToken)
  })

  it('reports loading until the space Safes, overviews and book have loaded', () => {
    mockSafes({}, { isLoading: true })
    expect(renderHook(() => useWorkspaceSigners()).result.current.isLoading).toBe(true)

    mockSafes({})
    mockUseGetMultipleSafeOverviewsQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    expect(renderHook(() => useWorkspaceSigners()).result.current.isLoading).toBe(true)

    mockUseGetMultipleSafeOverviewsQuery.mockReturnValue({ data: [], isLoading: false, isError: false })
    mockUseSpaceAddressBookState.mockReturnValue({ items: [], isLoading: true, isError: false, refetch: refetchBook })
    expect(renderHook(() => useWorkspaceSigners()).result.current.isLoading).toBe(true)

    mockUseSpaceAddressBookState.mockReturnValue({ items: [], isLoading: false, isError: false, refetch: refetchBook })
    expect(renderHook(() => useWorkspaceSigners()).result.current.isLoading).toBe(false)
  })

  it('reports an error when the space Safes request fails', () => {
    mockSafes(undefined, { isError: true })

    const { result } = renderHook(() => useWorkspaceSigners())

    expect(result.current.isError).toBe(true)
  })

  it('refetches the space Safes and the book', () => {
    const { result } = renderHook(() => useWorkspaceSigners())

    result.current.refetch()

    expect(refetchSafes).toHaveBeenCalledTimes(1)
    expect(refetchBook).toHaveBeenCalledTimes(1)
  })

  it('does not refetch while the queries are skipped', () => {
    mockSafes(undefined, { isUninitialized: true })
    mockUseSpaceAddressBookState.mockReturnValue({
      items: [],
      isLoading: false,
      isError: false,
      isUninitialized: true,
      refetch: refetchBook,
    })
    const { result } = renderHook(() => useWorkspaceSigners())

    result.current.refetch()

    expect(refetchSafes).not.toHaveBeenCalled()
    expect(refetchBook).not.toHaveBeenCalled()
  })
})
