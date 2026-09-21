import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import { getMemberTwoFactorStatus, getTwoFactorCoverage, MemberTwoFactorStatus } from '../twoFactor'

const oidcMember = (id: number) =>
  memberBuilder()
    .with({
      id,
      status: 'ACTIVE',
      user: memberUserBuilder()
        .with({ id, email: `user${id}@example.com` })
        .build(),
    })
    .build()

const walletMember = (id: number) =>
  memberBuilder()
    .with({ id, status: 'ACTIVE', user: memberUserBuilder().with({ id, email: null }).build() })
    .build()

const invitedMember = (id: number) =>
  memberBuilder()
    .with({
      id,
      status: 'INVITED',
      user: memberUserBuilder()
        .with({ id, status: 'PENDING', email: `invited${id}@example.com` })
        .build(),
    })
    .build()

const declinedMember = (id: number) =>
  memberBuilder()
    .with({ id, status: 'DECLINED', user: memberUserBuilder().with({ id, status: 'PENDING' }).build() })
    .build()

describe('getMemberTwoFactorStatus', () => {
  it('reports active 2FA for an active member with an email (Google/email sign-in)', () => {
    expect(getMemberTwoFactorStatus(oidcMember(1))).toBe(MemberTwoFactorStatus.ACTIVE)
  })

  it('reports a wallet sign-in for an active member without an email (SIWE)', () => {
    expect(getMemberTwoFactorStatus(walletMember(1))).toBe(MemberTwoFactorStatus.WALLET_SIGN_IN)
  })

  it('reports a pending invite regardless of the invitee having an email', () => {
    expect(getMemberTwoFactorStatus(invitedMember(1))).toBe(MemberTwoFactorStatus.INVITE_PENDING)
  })

  it('reports no status for a declined invite', () => {
    expect(getMemberTwoFactorStatus(declinedMember(1))).toBeUndefined()
  })
})

describe('getTwoFactorCoverage', () => {
  it('counts only active members, and only email/Google ones as enabled', () => {
    const members = [oidcMember(1), oidcMember(2), walletMember(3), invitedMember(4), declinedMember(5)]

    expect(getTwoFactorCoverage(members)).toEqual({ enabled: 2, total: 3, walletOnly: 1 })
  })

  it('reports full coverage when every active member signs in with email or Google', () => {
    expect(getTwoFactorCoverage([oidcMember(1), oidcMember(2)])).toEqual({ enabled: 2, total: 2, walletOnly: 0 })
  })

  it('reports zero coverage for an empty member list', () => {
    expect(getTwoFactorCoverage([])).toEqual({ enabled: 0, total: 0, walletOnly: 0 })
  })

  it('counts every wallet member as unable to enable 2FA', () => {
    const members = [oidcMember(1), walletMember(2), walletMember(3)]

    expect(getTwoFactorCoverage(members)).toEqual({ enabled: 1, total: 3, walletOnly: 2 })
  })

  it('excludes pending and declined invites from the wallet-only count', () => {
    expect(getTwoFactorCoverage([invitedMember(1), declinedMember(2)])).toEqual({
      enabled: 0,
      total: 0,
      walletOnly: 0,
    })
  })
})
