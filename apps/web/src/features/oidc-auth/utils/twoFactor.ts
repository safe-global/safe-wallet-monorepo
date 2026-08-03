import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

/**
 * Workspace members enrol in 2FA implicitly: email and Google sign-ins are always
 * forced through an authenticator, wallet (SIWE) sign-ins never are. CGW exposes no
 * per-user enrolment status, so the presence of an email on the member's user record
 * is what tells the two apart. This holds only while the "OIDC always enrols" policy
 * does — real enrolment status would need Management API plumbing.
 */
export enum MemberTwoFactorStatus {
  ACTIVE = 'ACTIVE',
  WALLET_SIGN_IN = 'WALLET_SIGN_IN',
  INVITE_PENDING = 'INVITE_PENDING',
}

type TwoFactorMember = Pick<MemberDto, 'status' | 'user'>

/** Declined invitees have no meaningful 2FA state, hence `undefined`. */
export const getMemberTwoFactorStatus = (member: TwoFactorMember): MemberTwoFactorStatus | undefined => {
  if (member.status === 'DECLINED') return undefined
  if (member.status === 'INVITED') return MemberTwoFactorStatus.INVITE_PENDING
  return member.user.email ? MemberTwoFactorStatus.ACTIVE : MemberTwoFactorStatus.WALLET_SIGN_IN
}

/** Coverage across members who have actually joined; pending and declined invites don't count. */
export const getTwoFactorCoverage = (members: TwoFactorMember[]): { enabled: number; total: number } => {
  const activeMembers = members.filter((member) => member.status === 'ACTIVE')

  return {
    enabled: activeMembers.filter((member) => getMemberTwoFactorStatus(member) === MemberTwoFactorStatus.ACTIVE).length,
    total: activeMembers.length,
  }
}
