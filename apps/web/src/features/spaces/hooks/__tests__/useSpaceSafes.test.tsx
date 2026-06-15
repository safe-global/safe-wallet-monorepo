import { renderHook } from '@testing-library/react'
import { useSpaceSafes } from '../useSpaceSafes'
import { SPACE_REFRESH_OPTIONS } from '../refreshOptions'
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'

const mockUseCurrentSpaceId = jest.fn()
const mockUseSpaceSafesGetV1Query = jest.fn()
const mockUseGetSpaceAddressBook = jest.fn()
const mockUseWallet = jest.fn()
const mockUseAllOwnedSafes = jest.fn()
const mockUseAllSafesGrouped = jest.fn()
let mockIsAuthenticated = true

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
    return undefined
  },
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: 'isAuthenticated',
}))

jest.mock('@/store/orderByPreferenceSlice', () => ({
  selectOrderByPreference: 'selectOrderByPreference',
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

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith(expect.anything(), {
      skip: true,
      ...SPACE_REFRESH_OPTIONS,
    })
  })

  it('skips the query when there is no current spaceId', () => {
    mockUseCurrentSpaceId.mockReturnValue(null)

    renderHook(() => useSpaceSafes())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith(expect.anything(), {
      skip: true,
      ...SPACE_REFRESH_OPTIONS,
    })
  })

  it('fires the query when authenticated and spaceId is set', () => {
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)

    renderHook(() => useSpaceSafes())

    expect(mockUseSpaceSafesGetV1Query).toHaveBeenCalledWith(
      { spaceId: MOCK_SPACE_UUID },
      { skip: false, ...SPACE_REFRESH_OPTIONS },
    )
  })
})
