import type { WalletInviteUserDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export enum MemberRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

/** The role as the gateway sends it. */
export const toMemberRole = (role: WalletInviteUserDto['role']): MemberRole =>
  role === 'ADMIN' ? MemberRole.ADMIN : MemberRole.MEMBER
