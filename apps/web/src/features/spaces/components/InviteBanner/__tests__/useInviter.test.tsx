import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useInviter } from '../useInviter'
import { spaceBuilder, spaceMemberBuilder } from '@/tests/builders/space'

const EMAIL = faker.internet.email()
const CURRENT_USER_ID = 1

const buildSpaceWithMember = (invitedByName?: string) =>
  spaceBuilder()
    .with({
      members: [
        spaceMemberBuilder()
          .with({ user: { id: CURRENT_USER_ID }, invitedByName })
          .build(),
      ],
    })
    .build()

const mockUseUsersGetWithWalletsV1Query = jest.fn()

jest.mock('@/store', () => ({
  useAppSelector: jest.fn(() => true),
}))

jest.mock('@/store/authSlice', () => ({
  isAuthenticated: jest.fn(),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: (...args: unknown[]) => mockUseUsersGetWithWalletsV1Query(...args),
}))

describe('useInviter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: CURRENT_USER_ID } })
  })

  it('returns undefined when no space is provided', () => {
    const { result } = renderHook(() => useInviter(undefined))
    expect(result.current).toBeUndefined()
  })

  it('returns invitedByName for the current user', () => {
    const { result } = renderHook(() => useInviter(buildSpaceWithMember(EMAIL)))
    expect(result.current).toBe(EMAIL)
  })

  it('returns undefined when the current user is not a member', () => {
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: { id: 999 } })
    const { result } = renderHook(() => useInviter(buildSpaceWithMember(EMAIL)))
    expect(result.current).toBeUndefined()
  })

  it('returns undefined when there is no current user', () => {
    mockUseUsersGetWithWalletsV1Query.mockReturnValue({ currentData: undefined })
    const { result } = renderHook(() => useInviter(buildSpaceWithMember(EMAIL)))
    expect(result.current).toBeUndefined()
  })

  it('returns undefined when the member exists but has no inviter name', () => {
    const { result } = renderHook(() => useInviter(buildSpaceWithMember(undefined)))
    expect(result.current).toBeUndefined()
  })
})
