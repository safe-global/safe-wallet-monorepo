import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import { useMemberNameResolver } from '../useMemberNameResolver'
import { useSpaceMembersByStatus } from '../useSpaceMembers'

jest.mock('../useSpaceMembers', () => ({
  ...jest.requireActual('../useSpaceMembers'),
  useSpaceMembersByStatus: jest.fn(),
}))

const mockMembersByStatus = jest.mocked(useSpaceMembersByStatus)

const member = (overrides: Partial<MemberDto> = {}): MemberDto =>
  memberBuilder()
    .with({
      name: faker.person.fullName(),
      user: memberUserBuilder()
        .with({ id: faker.number.int({ max: 1_000_000 }) })
        .build(),
    })
    .with(overrides)
    .build()

const resolveWith = ({ activeMembers = [], invitedMembers = [] }: Partial<Record<string, MemberDto[]>>) => {
  mockMembersByStatus.mockReturnValue({ activeMembers, invitedMembers })
  return renderHook(() => useMemberNameResolver()).result.current
}

describe('useMemberNameResolver', () => {
  it('resolves the name of an active member by user id', () => {
    const alice = member()

    const resolve = resolveWith({ activeMembers: [alice] })

    expect(resolve(alice.user.id)).toBe(alice.name)
  })

  it('resolves the name of an invited member by user id', () => {
    const invitee = member({ status: 'INVITED' })

    const resolve = resolveWith({ invitedMembers: [invitee] })

    expect(resolve(invitee.user.id)).toBe(invitee.name)
  })

  it('resolves to the alias when the member has one', () => {
    const alice = member({ alias: 'Treasury lead' })

    const resolve = resolveWith({ activeMembers: [alice] })

    expect(resolve(alice.user.id)).toBe('Treasury lead')
  })

  it('resolves to undefined for a user who is not a member', () => {
    const alice = member()

    const resolve = resolveWith({ activeMembers: [alice] })

    expect(resolve(alice.user.id + 1)).toBeUndefined()
  })

  it('resolves to undefined without a user id', () => {
    const resolve = resolveWith({ activeMembers: [member()] })

    expect(resolve(undefined)).toBeUndefined()
  })

  it('resolves to undefined for a member without a name', () => {
    const nameless = member({ name: '', alias: null })

    const resolve = resolveWith({ activeMembers: [nameless] })

    expect(resolve(nameless.user.id)).toBeUndefined()
  })
})
