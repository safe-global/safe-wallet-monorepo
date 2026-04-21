import { renderHook } from '@testing-library/react'
import { useSpaceMembersByStatus, useCurrentMembership } from '../useSpaceMembers'

const mockUseCurrentSpaceId = jest.fn()
const mockUseMembersGetUsersV1Query = jest.fn()
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
  useMembersGetUsersV1Query: (...args: unknown[]) => mockUseMembersGetUsersV1Query(...args),
  useMembersGetMembershipV1Query: jest.fn(() => ({ currentData: undefined, isLoading: false })),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  useAuthGetMeV1Query: jest.fn(() => ({ data: undefined, isLoading: false })),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: jest.fn(() => ({ currentData: undefined })),
}))

describe('useAllMembers (via useSpaceMembersByStatus / useCurrentMembership)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAuthenticated = true
    mockUseMembersGetUsersV1Query.mockReturnValue({ data: undefined })
  })

  it('skips the members query when the user is not authenticated', () => {
    mockIsAuthenticated = false
    mockUseCurrentSpaceId.mockReturnValue('3')

    renderHook(() => useSpaceMembersByStatus())

    expect(mockUseMembersGetUsersV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('skips the members query when there is no current spaceId', () => {
    mockUseCurrentSpaceId.mockReturnValue(null)

    renderHook(() => useSpaceMembersByStatus())

    expect(mockUseMembersGetUsersV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('skips the members query when the explicit spaceId arg is 0', () => {
    mockUseCurrentSpaceId.mockReturnValue('5')

    renderHook(() => useCurrentMembership(0))

    expect(mockUseMembersGetUsersV1Query).toHaveBeenCalledWith(expect.anything(), { skip: true })
  })

  it('fires the members query with the numeric spaceId when authenticated and spaceId is set', () => {
    mockUseCurrentSpaceId.mockReturnValue('9')

    renderHook(() => useSpaceMembersByStatus())

    expect(mockUseMembersGetUsersV1Query).toHaveBeenCalledWith({ spaceId: 9 }, { skip: false })
  })

  it('prefers the explicit spaceId arg over the current spaceId', () => {
    mockUseCurrentSpaceId.mockReturnValue('9')

    renderHook(() => useCurrentMembership(2))

    expect(mockUseMembersGetUsersV1Query).toHaveBeenCalledWith({ spaceId: 2 }, { skip: false })
  })
})
