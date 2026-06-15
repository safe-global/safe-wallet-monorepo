import { renderHook } from '@testing-library/react'
import { useSpaceSafes } from '../useSpaceSafes'
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'

const mockUseCurrentSpaceId = jest.fn()
const mockUseSpaceSafesGetV1Query = jest.fn()
const mockUseGetSpaceAddressBook = jest.fn()
const mockUseWallet = jest.fn()
const mockUseAllOwnedSafes = jest.fn()
const mockUseAllSafesGrouped = jest.fn()
let mockIsAuthenticated = true
let mockLocalAddressBook: Record<string, Record<string, string>> = {}

jest.mock('../useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('../useGetSpaceAddressBook', () => ({
  __esModule: true,
  default: () => mockUseGetSpaceAddressBook(),
}))

jest.mock('@/store', () => ({
  useAppSelector: (selector: string) => {
    if (selector === 'isAuthenticated') return mockIsAuthenticated
    if (selector === 'selectOrderByPreference') return { orderBy: 'name' }
    if (selector === 'selectAllAddressBooks') return mockLocalAddressBook
    if (selector === 'selectAllVisitedSafes') return {}
    return undefined
  },
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: 'isAuthenticated',
}))

jest.mock('@/store/orderByPreferenceSlice', () => ({
  selectOrderByPreference: 'selectOrderByPreference',
}))

jest.mock('@/store/slices', () => ({
  selectAllAddressBooks: 'selectAllAddressBooks',
  selectAllVisitedSafes: 'selectAllVisitedSafes',
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpaceSafesGetV1Query: (...args: unknown[]) => mockUseSpaceSafesGetV1Query(...args),
}))

jest.mock('@/hooks/safes', () => ({
  _buildSafeItems: jest.fn(() => []),
  useAllSafesGrouped: () => mockUseAllSafesGrouped(),
  useAllOwnedSafes: () => mockUseAllOwnedSafes(),
  getComparator: () => () => 0,
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

jest.mock('../../utils', () => ({
  mapSpaceContactsToAddressBookState: jest.fn(() => ({})),
}))

describe('useSpaceSafes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = true
    mockLocalAddressBook = {}
    mockUseGetSpaceAddressBook.mockReturnValue([])
    mockUseWallet.mockReturnValue({ address: '0xabc' })
    mockUseAllOwnedSafes.mockReturnValue([{}])
    mockUseAllSafesGrouped.mockReturnValue({ allMultiChainSafes: [], allSingleSafes: [] })
    mockUseSpaceSafesGetV1Query.mockReturnValue({
      currentData: undefined,
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: jest.fn(),
    })
  })

  it('skips the query when the user is not authenticated', () => {
    mockIsAuthenticated = false
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)

    renderHook(() => useSpaceSafes())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('skips the query when there is no current spaceId', () => {
    mockUseCurrentSpaceId.mockReturnValue(null)

    renderHook(() => useSpaceSafes())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('fires the query when authenticated and spaceId is set', () => {
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)

    renderHook(() => useSpaceSafes())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith({ spaceId: MOCK_SPACE_UUID }, { skip: false })
  })

  // Regression: address-book-named safes must sort by their displayed name. Without folding the
  // user's address book into the name source, `name` is empty here and "Name" sorting no-ops.
  it('merges the local address book under space contacts when building safe items', () => {
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)
    mockUseSpaceSafesGetV1Query.mockReturnValue({
      currentData: { safes: { '1': ['0xA'] } },
      isLoading: false,
      isError: false,
      error: undefined,
      refetch: jest.fn(),
    })
    mockLocalAddressBook = { '1': { '0xA': 'Local Name' } }
    mockUseGetSpaceAddressBook.mockReturnValue([]) // no space contact for 0xA

    renderHook(() => useSpaceSafes())

    const { _buildSafeItems } = jest.requireMock('@/hooks/safes') as { _buildSafeItems: jest.Mock }
    expect(_buildSafeItems).toHaveBeenCalledWith(
      { '1': ['0xA'] },
      expect.objectContaining({ '1': { '0xA': 'Local Name' } }),
      expect.anything(),
      expect.anything(),
    )
  })
})
