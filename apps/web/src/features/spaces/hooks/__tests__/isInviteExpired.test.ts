import { memberBuilder } from '@/tests/builders/member'
import { isInviteExpired } from '../useSpaceMembers'

describe('isInviteExpired', () => {
  it('returns true for an INVITED member whose inviteExpiresAt is in the past', () => {
    const member = memberBuilder().with({ status: 'INVITED', inviteExpiresAt: '2020-01-01T00:00:00.000Z' }).build()
    expect(isInviteExpired(member)).toBe(true)
  })

  it('returns false for an INVITED member whose inviteExpiresAt is in the future', () => {
    const member = memberBuilder().with({ status: 'INVITED', inviteExpiresAt: '2999-01-01T00:00:00.000Z' }).build()
    expect(isInviteExpired(member)).toBe(false)
  })

  it('returns false when inviteExpiresAt is null or undefined', () => {
    expect(isInviteExpired(memberBuilder().with({ status: 'INVITED', inviteExpiresAt: null }).build())).toBe(false)
    expect(isInviteExpired(memberBuilder().with({ status: 'INVITED', inviteExpiresAt: undefined }).build())).toBe(false)
  })

  it('returns false for non-INVITED members even with a past expiry', () => {
    const past = '2020-01-01T00:00:00.000Z'
    expect(isInviteExpired(memberBuilder().with({ status: 'ACTIVE', inviteExpiresAt: past }).build())).toBe(false)
    expect(isInviteExpired(memberBuilder().with({ status: 'DECLINED', inviteExpiresAt: past }).build())).toBe(false)
  })
})
