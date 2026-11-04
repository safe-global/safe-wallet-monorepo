import { renderHook } from '@testing-library/react'
import useGetAddressBookRequests, { useAddressBookRequestsState } from '../useGetAddressBookRequests'
import { SPACE_REFRESH_OPTIONS } from '../refreshOptions'

const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'

const mockUseCurrentSpaceId = jest.fn()
const mockUseAddressBookRequestsGetPendingRequestsV1Query = jest.fn()
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

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBookRequestsGetPendingRequestsV1Query: (...args: unknown[]) =>
    mockUseAddressBookRequestsGetPendingRequestsV1Query(...args),
}))

describe('useGetAddressBookRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = true
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)
    mockUseAddressBookRequestsGetPendingRequestsV1Query.mockReturnValue({ currentData: undefined, refetch: jest.fn() })
  })

  it('skips the query when the user is not authenticated', () => {
    mockIsAuthenticated = false

    renderHook(() => useGetAddressBookRequests())

    expect(mockUseAddressBookRequestsGetPendingRequestsV1Query).toHaveBeenCalledWith(expect.anything(), {
      skip: true,
      ...SPACE_REFRESH_OPTIONS,
    })
  })

  it('skips the query when there is no current spaceId', () => {
    mockUseCurrentSpaceId.mockReturnValue(null)

    renderHook(() => useGetAddressBookRequests())

    expect(mockUseAddressBookRequestsGetPendingRequestsV1Query).toHaveBeenCalledWith(expect.anything(), {
      skip: true,
      ...SPACE_REFRESH_OPTIONS,
    })
  })

  it('returns the requests when the query resolves', () => {
    const data = [{ address: '0xabc', name: 'Alice', chainIds: ['1'] }]
    mockUseAddressBookRequestsGetPendingRequestsV1Query.mockReturnValue({ currentData: { data }, refetch: jest.fn() })

    const { result } = renderHook(() => useGetAddressBookRequests())

    expect(result.current).toEqual(data)
  })
})

describe('useAddressBookRequestsState', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = true
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)
  })

  it('reports the first load so callers can tell an empty list from an unloaded one', () => {
    mockUseAddressBookRequestsGetPendingRequestsV1Query.mockReturnValue({
      currentData: undefined,
      isLoading: true,
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useAddressBookRequestsState())

    expect(result.current).toMatchObject({ items: [], isLoading: true })
  })

  it('reports a failed read rather than an empty list', () => {
    mockUseAddressBookRequestsGetPendingRequestsV1Query.mockReturnValue({
      currentData: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    })

    const { result } = renderHook(() => useAddressBookRequestsState())

    expect(result.current).toMatchObject({ items: [], isLoading: false, isError: true })
  })

  it('exposes refetch so a failed read can be retried', () => {
    const refetch = jest.fn()
    mockUseAddressBookRequestsGetPendingRequestsV1Query.mockReturnValue({
      currentData: undefined,
      isError: true,
      refetch,
    })

    const { result } = renderHook(() => useAddressBookRequestsState())
    result.current.refetch()

    expect(refetch).toHaveBeenCalled()
  })
})
