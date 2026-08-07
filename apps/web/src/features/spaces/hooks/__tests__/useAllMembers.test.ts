import { renderHook } from '@testing-library/react'
import { useSpaceMembersByStatus, useCurrentMembership } from '../useSpaceMembers'
import { SPACE_REFRESH_OPTIONS } from '../refreshOptions'
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const MOCK_SPACE_UUID_ALT = '22222222-2222-2222-2222-222222222222'

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
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)

    renderHook(() => useSpaceMembersByStatus())

    expect(mockUseMembersGetUsersV1Query).toHaveBeenCalledWith(expect.anything(), {
      skip: true,
      ...SPACE_REFRESH_OPTIONS,
    })
  })

  it('skips the members query when there is no current spaceId', () => {
    mockUseCurrentSpaceId.mockReturnValue(null)

    renderHook(() => useSpaceMembersByStatus())

    expect(mockUseMembersGetUsersV1Query).toHaveBeenCalledWith(expect.anything(), {
      skip: true,
      ...SPACE_REFRESH_OPTIONS,
    })
  })

  it('fires the members query with the spaceId when authenticated and spaceId is set', () => {
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)

    renderHook(() => useSpaceMembersByStatus())

    expect(mockUseMembersGetUsersV1Query).toHaveBeenCalledWith(
      { spaceId: MOCK_SPACE_UUID },
      { skip: false, ...SPACE_REFRESH_OPTIONS },
    )
  })

  it('prefers the explicit spaceId arg over the current spaceId', () => {
    mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)

    renderHook(() => useCurrentMembership(MOCK_SPACE_UUID_ALT))

    expect(mockUseMembersGetUsersV1Query).toHaveBeenCalledWith(
      { spaceId: MOCK_SPACE_UUID_ALT },
      { skip: false, ...SPACE_REFRESH_OPTIONS },
    )
  })

  describe('revoked membership (failed refetch)', () => {
    const staleMembers = [
      { status: 'ACTIVE', user: { id: 'u1' } },
      { status: 'INVITED', user: { id: 'u2' } },
    ]

    it.each([403, 404])('drops access when the refetch returns %i, ignoring stale data', (status) => {
      mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)
      mockUseMembersGetUsersV1Query.mockReturnValue({ data: { members: staleMembers }, error: { status } })

      const { result } = renderHook(() => useSpaceMembersByStatus())

      expect(result.current.activeMembers).toEqual([])
      expect(result.current.invitedMembers).toEqual([])
    })

    it('keeps the stale member list on a transient error so a blip does not drop access', () => {
      mockUseCurrentSpaceId.mockReturnValue(MOCK_SPACE_UUID)
      mockUseMembersGetUsersV1Query.mockReturnValue({ data: { members: staleMembers }, error: { status: 500 } })

      const { result } = renderHook(() => useSpaceMembersByStatus())

      expect(result.current.activeMembers).toHaveLength(1)
      expect(result.current.invitedMembers).toHaveLength(1)
    })
  })
})
