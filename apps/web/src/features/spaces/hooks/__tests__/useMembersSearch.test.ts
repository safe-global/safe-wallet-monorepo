import { renderHook } from '@/tests/test-utils'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import { useMembersSearch } from '../useMembersSearch'

describe('useMembersSearch', () => {
  const members = [
    memberBuilder()
      .with({
        id: 1,
        role: 'ADMIN',
        name: 'Alice',
        user: memberUserBuilder().with({ email: 'alice@example.com' }).build(),
      })
      .build(),
    memberBuilder()
      .with({
        id: 2,
        status: 'INVITED',
        name: 'Bob',
        user: memberUserBuilder().with({ id: 12, status: 'PENDING' }).build(),
      })
      .build(),
  ]

  it('returns all members when the query is empty', () => {
    const { result } = renderHook(() => useMembersSearch(members, ''))

    expect(result.current).toEqual(members)
  })

  it('matches members by email', () => {
    const { result } = renderHook(() => useMembersSearch(members, 'alice@example.com'))

    expect(result.current).toEqual([members[0]])
  })

  it('matches members by name', () => {
    const { result } = renderHook(() => useMembersSearch(members, 'Bob'))

    expect(result.current).toEqual([members[1]])
  })

  it('matches members by partial email fragments', () => {
    const { result } = renderHook(() => useMembersSearch(members, 'example'))

    expect(result.current).toEqual([members[0]])
  })

  it('matches members by email case-insensitively', () => {
    const { result } = renderHook(() => useMembersSearch(members, 'ALICE@EXAMPLE.COM'))

    expect(result.current).toEqual([members[0]])
  })

  it('returns no members when the email query does not match', () => {
    const { result } = renderHook(() => useMembersSearch(members, 'charlie@example.com'))

    expect(result.current).toEqual([])
  })
})
