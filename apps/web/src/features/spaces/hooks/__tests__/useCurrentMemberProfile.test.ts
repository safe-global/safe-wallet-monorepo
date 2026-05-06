import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useCurrentMemberProfile } from '../useSpaceMembers'

const mockUseAuthGetMeV1Query = jest.fn()
const mockUseMembersGetMembershipV1Query = jest.fn()
const mockUseCurrentSpaceId = jest.fn()
const mockUseAppSelector = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  useAuthGetMeV1Query: (...args: unknown[]) => mockUseAuthGetMeV1Query(...args),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useMembersGetMembershipV1Query: (...args: unknown[]) => mockUseMembersGetMembershipV1Query(...args),
  useMembersGetUsersV1Query: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: jest.fn(),
}))

jest.mock('../useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => mockUseCurrentSpaceId(),
}))

jest.mock('@/store', () => ({
  useAppSelector: () => mockUseAppSelector(),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: 'isAuthenticated',
}))

describe('useCurrentMemberProfile', () => {
  const createMember = (overrides: Record<string, unknown> = {}) => ({
    id: faker.number.int(),
    name: faker.person.firstName(),
    role: 'MEMBER' as const,
    status: 'ACTIVE' as const,
    user: { id: faker.number.int(), status: 'ACTIVE' as const },
    ...overrides,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCurrentSpaceId.mockReturnValue('1')
    mockUseAppSelector.mockReturnValue(true)
    mockUseAuthGetMeV1Query.mockReturnValue({ data: undefined, isLoading: false })
    mockUseMembersGetMembershipV1Query.mockReturnValue({ currentData: undefined, isLoading: false })
  })

  it('returns membership from the /membership endpoint', () => {
    const member = createMember()
    mockUseMembersGetMembershipV1Query.mockReturnValue({ currentData: member, isLoading: false })

    const { result } = renderHook(() => useCurrentMemberProfile())

    expect(result.current.membership).toEqual(member)
  })

  it('returns signerAddress when authMethod is siwe', () => {
    const signerAddress = faker.finance.ethereumAddress()
    mockUseAuthGetMeV1Query.mockReturnValue({
      data: { id: 'u1', authMethod: 'siwe', signerAddress },
      isLoading: false,
    })

    const { result } = renderHook(() => useCurrentMemberProfile())

    expect(result.current.signerAddress).toBe(signerAddress)
  })

  it('returns undefined signerAddress when authMethod is oidc', () => {
    mockUseAuthGetMeV1Query.mockReturnValue({
      data: { id: 'u1', authMethod: 'oidc' },
      isLoading: false,
    })

    const { result } = renderHook(() => useCurrentMemberProfile())

    expect(result.current.signerAddress).toBeUndefined()
  })

  it('returns email when present on the session', () => {
    const email = faker.internet.email().toLowerCase()
    mockUseAuthGetMeV1Query.mockReturnValue({
      data: { id: 'u1', authMethod: 'oidc', email },
      isLoading: false,
    })

    const { result } = renderHook(() => useCurrentMemberProfile())

    expect(result.current.email).toBe(email)
  })

  it('returns undefined signerAddress when session is not loaded', () => {
    const { result } = renderHook(() => useCurrentMemberProfile())

    expect(result.current.signerAddress).toBeUndefined()
  })

  it('aggregates isLoading from both queries', () => {
    mockUseAuthGetMeV1Query.mockReturnValue({ data: undefined, isLoading: true })
    mockUseMembersGetMembershipV1Query.mockReturnValue({ currentData: undefined, isLoading: false })

    const { result } = renderHook(() => useCurrentMemberProfile())

    expect(result.current.isLoading).toBe(true)
  })

  it('isLoading is false when both queries are idle', () => {
    const { result } = renderHook(() => useCurrentMemberProfile())

    expect(result.current.isLoading).toBe(false)
  })

  it('skips both queries when not authenticated', () => {
    mockUseAppSelector.mockReturnValue(false)

    renderHook(() => useCurrentMemberProfile())

    expect(mockUseAuthGetMeV1Query).toHaveBeenCalledWith(undefined, { skip: true })
    expect(mockUseMembersGetMembershipV1Query).toHaveBeenCalledWith({ spaceId: 1 }, { skip: true })
  })

  it('skips membership query when there is no spaceId', () => {
    mockUseCurrentSpaceId.mockReturnValue(null)

    renderHook(() => useCurrentMemberProfile())

    expect(mockUseMembersGetMembershipV1Query).toHaveBeenCalledWith({ spaceId: expect.any(Number) }, { skip: true })
  })
})
