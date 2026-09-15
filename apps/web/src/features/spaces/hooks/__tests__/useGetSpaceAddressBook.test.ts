import { renderHook } from '@testing-library/react'
import useGetSpaceAddressBook from '../useGetSpaceAddressBook'
import { SPACE_REFRESH_OPTIONS } from '../refreshOptions'
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'

const mockUseCurrentSpaceId = jest.fn()
const mockUseAddressBooksGetAddressBookItemsV1Query = jest.fn()
let mockIsAuthenticated = true

jest.mock('../useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('@/store', () => ({
  useAppSelector: () => mockIsAuthenticated,
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: 'isAuthenticated',
}))

let mockConfigs: { chainId: string }[] = []

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockConfigs }),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBooksGetAddressBookItemsV1Query: (...args: unknown[]) =>
    mockUseAddressBooksGetAddressBookItemsV1Query(...args),
}))

describe('useGetSpaceAddressBook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = true
    mockConfigs = [{ chainId: '1' }, { chainId: '137' }]
    mockUseAddressBooksGetAddressBookItemsV1Query.mockReturnValue({ currentData: undefined })
  })

  it('skips the query when the user is not authenticated', () => {
    mockIsAuthenticated = false
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)

    renderHook(() => useGetSpaceAddressBook())

    expect(mockUseAddressBooksGetAddressBookItemsV1Query).toHaveBeenCalledWith(expect.anything(), {
      skip: true,
      ...SPACE_REFRESH_OPTIONS,
    })
  })

  it('skips the query when there is no current spaceId', () => {
    mockUseCurrentSpaceId.mockReturnValue(null)

    renderHook(() => useGetSpaceAddressBook())

    expect(mockUseAddressBooksGetAddressBookItemsV1Query).toHaveBeenCalledWith(expect.anything(), {
      skip: true,
      ...SPACE_REFRESH_OPTIONS,
    })
  })

  it('skips the query when spaceId is an empty string', () => {
    mockUseCurrentSpaceId.mockReturnValue('')

    renderHook(() => useGetSpaceAddressBook())

    expect(mockUseAddressBooksGetAddressBookItemsV1Query).toHaveBeenCalledWith(expect.anything(), {
      skip: true,
      ...SPACE_REFRESH_OPTIONS,
    })
  })

  it('fires the query with the spaceId when authenticated and spaceId is set', () => {
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)

    renderHook(() => useGetSpaceAddressBook())

    expect(mockUseAddressBooksGetAddressBookItemsV1Query).toHaveBeenCalledWith(
      { spaceId: MOCK_SPACE_UUID },
      { skip: false, ...SPACE_REFRESH_OPTIONS },
    )
  })

  it('returns every contact on every supported chain, replacing the stored chainIds', () => {
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)
    const data = [
      { address: '0xabc', name: 'Alice', chainIds: ['1'] },
      { address: '0xdef', name: 'Bob', chainIds: ['1', '137'] },
    ]
    mockUseAddressBooksGetAddressBookItemsV1Query.mockReturnValue({ currentData: { data } })

    const { result } = renderHook(() => useGetSpaceAddressBook())

    expect(result.current).toEqual([
      { address: '0xabc', name: 'Alice', chainIds: ['1', '137'] },
      { address: '0xdef', name: 'Bob', chainIds: ['1', '137'] },
    ])
  })

  it('keeps the stored chainIds while the chain config is empty', () => {
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)
    mockConfigs = []
    const data = [{ address: '0xabc', name: 'Alice', chainIds: ['1'] }]
    mockUseAddressBooksGetAddressBookItemsV1Query.mockReturnValue({ currentData: { data } })

    const { result } = renderHook(() => useGetSpaceAddressBook())

    expect(result.current).toEqual(data)
  })

  it('returns an empty array when the query has no data', () => {
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)

    const { result } = renderHook(() => useGetSpaceAddressBook())

    expect(result.current).toEqual([])
  })
})
