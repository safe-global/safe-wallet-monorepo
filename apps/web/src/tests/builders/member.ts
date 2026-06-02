import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

import { Builder, type IBuilder } from '../Builder'

type MemberUser = MemberDto['user']

export function memberUserBuilder(): IBuilder<MemberUser> {
  return Builder.new<MemberUser>().with({
    id: 11,
    status: 'ACTIVE',
    email: null,
  })
}

export function memberBuilder(): IBuilder<MemberDto> {
  return Builder.new<MemberDto>().with({
    id: 1,
    role: 'MEMBER',
    status: 'ACTIVE',
    name: 'Alice',
    alias: null,
    invitedBy: null,
    createdAt: '2026-04-22T00:00:00.000Z',
    updatedAt: '2026-04-22T00:00:00.000Z',
    user: memberUserBuilder().build(),
  })
}
