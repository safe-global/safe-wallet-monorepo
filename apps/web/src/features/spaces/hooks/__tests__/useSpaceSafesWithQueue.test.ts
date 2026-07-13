import { renderHook } from '@testing-library/react'
import { useSpaceSafesWithQueue } from '../useSpaceSafesWithQueue'
import { faker } from '@faker-js/faker'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { SafeItem } from '@/hooks/safes'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockCurrency = 'usd'

const mockUseSpaceSafes = jest.fn()
jest.mock('../useSpaceSafes', () => ({
  useSpaceSafes: () => mockUseSpaceSafes(),
}))

jest.mock('@/store/settingsSlice', () => ({
  selectCurrency: 'selectCurrency',
}))

jest.mock('@/store', () => ({
  useAppSelector: (selector: string) => {
    if (selector === 'selectCurrency') return mockCurrency
    return undefined
  },
}))

jest.mock('@/hooks/safes', () => ({
  flattenSafeItems: (items: unknown[]) => items,
}))

const mockUseGetMultipleSafeOverviewsQuery = jest.fn()
jest.mock('@/store/api/gateway', () => ({
  useGetMultipleSafeOverviewsQuery: (...args: unknown[]) => mockUseGetMultipleSafeOverviewsQuery(...args),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ADDR_1 = faker.finance.ethereumAddress()
const ADDR_2 = faker.finance.ethereumAddress()
const ADDR_3 = faker.finance.ethereumAddress()

const createSafeItem = (chainId: string, address: string): SafeItem => ({
  chainId,
  address,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

const createOverview = (overrides: Partial<SafeOverview> = {}): SafeOverview => ({
  address: { value: overrides.address?.value ?? faker.finance.ethereumAddress() },
  chainId: '1',
  threshold: 2,
  owners: [{ value: faker.finance.ethereumAddress() }],
  fiatTotal: '1000',
  queued: 0,
  ...overrides,
})

const setupDefaults = ({
  safeItems = [],
  isLoadingSafes = false,
  overviews,
  isLoadingOverviews = false,
}: {
  safeItems?: SafeItem[]
  isLoadingSafes?: boolean
  overviews?: SafeOverview[]
  isLoadingOverviews?: boolean
} = {}) => {
  mockCurrency = 'usd'

  mockUseSpaceSafes.mockReturnValue({
    allSafes: safeItems,
    isLoading: isLoadingSafes,
  })
  mockUseGetMultipleSafeOverviewsQuery.mockReturnValue({
    data: overviews,
    isLoading: isLoadingOverviews,
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSpaceSafesWithQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty array and not loading when no overviews', () => {
    setupDefaults()

    const { result } = renderHook(() => useSpaceSafesWithQueue())

    expect(result.current.safesWithQueue).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('should query overviews with the flattened space safes and currency', () => {
    const safeItems = [createSafeItem('1', ADDR_1), createSafeItem('1', ADDR_2), createSafeItem('137', ADDR_3)]
    setupDefaults({ safeItems })

    renderHook(() => useSpaceSafesWithQueue())

    expect(mockUseGetMultipleSafeOverviewsQuery).toHaveBeenCalledWith({
      safes: safeItems,
      currency: 'usd',
    })
  })

  it('should return only safes with queued > 0', () => {
    const overviews = [
      createOverview({ chainId: '1', address: { value: ADDR_1 }, queued: 3 }),
      createOverview({ chainId: '1', address: { value: ADDR_2 }, queued: 0 }),
      createOverview({ chainId: '137', address: { value: ADDR_3 }, queued: 1 }),
    ]
    setupDefaults({
      safeItems: [createSafeItem('1', ADDR_1), createSafeItem('1', ADDR_2), createSafeItem('137', ADDR_3)],
      overviews,
    })

    const { result } = renderHook(() => useSpaceSafesWithQueue())

    expect(result.current.safesWithQueue).toEqual([
      { chainId: '1', address: ADDR_1 },
      { chainId: '137', address: ADDR_3 },
    ])
  })

  it('should return empty array when all safes have queued === 0', () => {
    const overviews = [
      createOverview({ chainId: '1', address: { value: ADDR_1 }, queued: 0 }),
      createOverview({ chainId: '137', address: { value: ADDR_2 }, queued: 0 }),
    ]
    setupDefaults({
      safeItems: [createSafeItem('1', ADDR_1), createSafeItem('137', ADDR_2)],
      overviews,
    })

    const { result } = renderHook(() => useSpaceSafesWithQueue())

    expect(result.current.safesWithQueue).toEqual([])
  })

  it('should report isLoading when safes are loading', () => {
    setupDefaults({ isLoadingSafes: true })

    const { result } = renderHook(() => useSpaceSafesWithQueue())

    expect(result.current.isLoading).toBe(true)
  })

  it('should report isLoading when overviews are loading', () => {
    setupDefaults({
      safeItems: [createSafeItem('1', ADDR_1)],
      isLoadingOverviews: true,
    })

    const { result } = renderHook(() => useSpaceSafesWithQueue())

    expect(result.current.isLoading).toBe(true)
  })

  it('should not be loading when both queries are done', () => {
    setupDefaults({
      safeItems: [createSafeItem('1', ADDR_1)],
      overviews: [createOverview({ chainId: '1', address: { value: ADDR_1 }, queued: 0 })],
    })

    const { result } = renderHook(() => useSpaceSafesWithQueue())

    expect(result.current.isLoading).toBe(false)
  })

  it('should query with empty safes when the space has none', () => {
    setupDefaults({ safeItems: [] })

    renderHook(() => useSpaceSafesWithQueue())

    expect(mockUseGetMultipleSafeOverviewsQuery).toHaveBeenCalledWith({ safes: [], currency: 'usd' })
  })
})
