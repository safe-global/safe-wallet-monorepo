import { renderHook } from '@testing-library/react'
import { useSpaceSafesWithQueue } from '../useSpaceSafesWithQueue'
import { faker } from '@faker-js/faker'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { GetSpaceSafeResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockIsAuthenticated = true
let mockCurrency = 'usd'

const mockUseCurrentSpaceId = jest.fn()
jest.mock('../useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: 'isAuthenticated',
}))

jest.mock('@/store/settingsSlice', () => ({
  selectCurrency: 'selectCurrency',
}))

jest.mock('@/store', () => ({
  useAppSelector: (selector: string) => {
    if (selector === 'isAuthenticated') return mockIsAuthenticated
    if (selector === 'selectCurrency') return mockCurrency
    return undefined
  },
}))

const mockUseSpaceSafesGetV1Query = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesGetV1Query: (...args: unknown[]) => mockUseSpaceSafesGetV1Query(...args),
}))

const mockUseSafesGetSafeOverviewV1Query = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safes', () => ({
  useSafesGetSafeOverviewV1Query: (...args: unknown[]) => mockUseSafesGetSafeOverviewV1Query(...args),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ADDR_1 = faker.finance.ethereumAddress()
const ADDR_2 = faker.finance.ethereumAddress()
const ADDR_3 = faker.finance.ethereumAddress()

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
  spaceId = '5',
  isAuthenticated = true,
  spaceSafes,
  isLoadingSafes = false,
  overviews,
  isLoadingOverviews = false,
}: {
  spaceId?: string | null
  isAuthenticated?: boolean
  spaceSafes?: GetSpaceSafeResponse
  isLoadingSafes?: boolean
  overviews?: SafeOverview[]
  isLoadingOverviews?: boolean
} = {}) => {
  mockUseCurrentSpaceId.mockReturnValue(spaceId)
  mockIsAuthenticated = isAuthenticated
  mockCurrency = 'usd'

  mockUseSpaceSafesGetV1Query.mockReturnValue({
    currentData: spaceSafes,
    isFetching: isLoadingSafes,
  })
  mockUseSafesGetSafeOverviewV1Query.mockReturnValue({
    currentData: overviews,
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

  it('should skip space safes query when not authenticated', () => {
    setupDefaults({ isAuthenticated: false })

    renderHook(() => useSpaceSafesWithQueue())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('should skip space safes query when no spaceId', () => {
    setupDefaults({ spaceId: null })

    renderHook(() => useSpaceSafesWithQueue())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('should not skip space safes query when authenticated with spaceId', () => {
    setupDefaults({ spaceId: '5', isAuthenticated: true })

    renderHook(() => useSpaceSafesWithQueue())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith({ spaceId: 5 }, { skip: false })
  })

  it('should build safes param from space safes response', () => {
    setupDefaults({
      spaceSafes: {
        safes: {
          '1': [ADDR_1, ADDR_2],
          '137': [ADDR_3],
        },
      },
    })

    renderHook(() => useSpaceSafesWithQueue())

    const overviewCallArgs = mockUseSafesGetSafeOverviewV1Query.mock.calls[0]
    expect(overviewCallArgs[0].safes).toBe(`1:${ADDR_1},1:${ADDR_2},137:${ADDR_3}`)
    expect(overviewCallArgs[0].currency).toBe('usd')
    expect(overviewCallArgs[0].trusted).toBe(true)
    expect(overviewCallArgs[0].excludeSpam).toBe(true)
  })

  it('should skip overview query when safes param is empty', () => {
    setupDefaults()

    renderHook(() => useSpaceSafesWithQueue())

    const overviewCallArgs = mockUseSafesGetSafeOverviewV1Query.mock.calls[0]
    expect(overviewCallArgs[1]).toEqual({ skip: true })
  })

  it('should not skip overview query when safes param is populated', () => {
    setupDefaults({
      spaceSafes: { safes: { '1': [ADDR_1] } },
    })

    renderHook(() => useSpaceSafesWithQueue())

    const overviewCallArgs = mockUseSafesGetSafeOverviewV1Query.mock.calls[0]
    expect(overviewCallArgs[1]).toEqual({ skip: false })
  })

  it('should return only safes with queued > 0', () => {
    const overviews = [
      createOverview({ chainId: '1', address: { value: ADDR_1 }, queued: 3 }),
      createOverview({ chainId: '1', address: { value: ADDR_2 }, queued: 0 }),
      createOverview({ chainId: '137', address: { value: ADDR_3 }, queued: 1 }),
    ]
    setupDefaults({
      spaceSafes: { safes: { '1': [ADDR_1, ADDR_2], '137': [ADDR_3] } },
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
      spaceSafes: { safes: { '1': [ADDR_1], '137': [ADDR_2] } },
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
      spaceSafes: { safes: { '1': [ADDR_1] } },
      isLoadingOverviews: true,
    })

    const { result } = renderHook(() => useSpaceSafesWithQueue())

    expect(result.current.isLoading).toBe(true)
  })

  it('should not be loading when both queries are done', () => {
    setupDefaults({
      spaceSafes: { safes: { '1': [ADDR_1] } },
      overviews: [createOverview({ chainId: '1', address: { value: ADDR_1 }, queued: 0 })],
    })

    const { result } = renderHook(() => useSpaceSafesWithQueue())

    expect(result.current.isLoading).toBe(false)
  })

  it('should handle empty safes object', () => {
    setupDefaults({
      spaceSafes: { safes: {} },
    })

    renderHook(() => useSpaceSafesWithQueue())

    const overviewCallArgs = mockUseSafesGetSafeOverviewV1Query.mock.calls[0]
    expect(overviewCallArgs[0].safes).toBe('')
    expect(overviewCallArgs[1]).toEqual({ skip: true })
  })
})
