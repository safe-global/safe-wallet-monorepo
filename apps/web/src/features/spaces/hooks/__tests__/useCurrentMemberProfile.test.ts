import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useCurrentMemberProfile } from '../useSpaceMembers'

const mockUseCurrentSpaceId = jest.fn()
const mockUseAppSelector = jest.fn()
const mockUseMembersGetUsersV1Query = jest.fn()
const mockUseUsersGetWithWalletsV1Query = jest.fn()

jest.mock('../useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('@/store', () => ({
  useAppSelector: () => mockUseAppSelector(),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: 'isAuthenticated',
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useMembersGetUsersV1Query: (...args: unknown[]) => mockUseMembersGetUsersV1Query(...args),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: (...args: unknown[]) => mockUseUsersGetWithWalletsV1Query(...args),
}))

describe('useCurrentMemberProfile', () => {
  const userId = faker.number.int()
  const walletAddress = faker.finance.ethereumAddress()

  const mockMember = {
    id: faker.number.int(),
    name: faker.person.firstName(),
    role: 'MEMBER' as const,
    status: 'ACTIVE' as const,
    user: { id: userId, status: 'ACTIVE' as const },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCurrentSpaceId.mockReturnValue('1')
    mockUseAppSelector.mockReturnValue(true)
  })

  it('returns membership and wallet address when data is loaded', () => {
    mockUseMembersGetUsersV1Query.mockReturnValue({
      data: { members: [mockMember] },
      isLoading: false,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({
      currentData: { id: userId, wallets: [{ id: 1, address: walletAddress }] },
      isLoading: false,
    })

    const { result } = renderHook(() => useCurrentMemberProfile())

    expect(result.current.membership).toEqual(mockMember)
    expect(result.current.walletAddress).toBe(walletAddress)
    expect(result.current.isLoading).toBe(false)
  })

  it('returns isLoading true when members query is loading', () => {
    mockUseMembersGetUsersV1Query.mockReturnValue({ data: undefined, isLoading: true })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: undefined, isLoading: false })

    const { result } = renderHook(() => useCurrentMemberProfile())

    expect(result.current.membership).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
  })

  it('returns isLoading true when users query is loading', () => {
    mockUseMembersGetUsersV1Query.mockReturnValue({
      data: { members: [mockMember] },
      isLoading: false,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: undefined, isLoading: true })

    const { result } = renderHook(() => useCurrentMemberProfile())

    expect(result.current.membership).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
  })

  it('returns undefined membership when user is not in members list', () => {
    mockUseMembersGetUsersV1Query.mockReturnValue({
      data: { members: [mockMember] },
      isLoading: false,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({
      currentData: { id: faker.number.int(), wallets: [] },
      isLoading: false,
    })

    const { result } = renderHook(() => useCurrentMemberProfile())

    expect(result.current.membership).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('returns undefined walletAddress when user has no wallets', () => {
    mockUseMembersGetUsersV1Query.mockReturnValue({
      data: { members: [mockMember] },
      isLoading: false,
    })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({
      currentData: { id: userId, wallets: [] },
      isLoading: false,
    })

    const { result } = renderHook(() => useCurrentMemberProfile())

    expect(result.current.membership).toEqual(mockMember)
    expect(result.current.walletAddress).toBeUndefined()
  })

  it('uses provided spaceId over current space id', () => {
    const customSpaceId = faker.number.int()
    mockUseMembersGetUsersV1Query.mockReturnValue({ data: undefined, isLoading: false })
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: undefined, isLoading: false })

    renderHook(() => useCurrentMemberProfile(customSpaceId))

    expect(mockUseMembersGetUsersV1Query).toHaveBeenCalledWith(
      { spaceId: customSpaceId },
      expect.objectContaining({ skip: false }),
    )
  })
})
