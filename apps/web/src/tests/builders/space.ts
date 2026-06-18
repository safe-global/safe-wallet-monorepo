import type { GetSpaceResponse, SpaceMemberDto, UserDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

import { Builder, type IBuilder } from '../Builder'
import { faker } from '@faker-js/faker'

export function spaceMemberUserBuilder(): IBuilder<UserDto> {
  return Builder.new<UserDto>().with({
    id: 1,
  })
}

export function spaceMemberBuilder(): IBuilder<SpaceMemberDto> {
  return Builder.new<SpaceMemberDto>().with({
    role: 'MEMBER',
    name: faker.person.firstName(),
    invitedBy: faker.number.int({ min: 1, max: 10 }),
    inviteExpiresAt: null,
    status: 'ACTIVE',
    user: spaceMemberUserBuilder().build(),
  })
}

export function spaceBuilder(): IBuilder<GetSpaceResponse> {
  return Builder.new<GetSpaceResponse>().with({
    uuid: faker.string.uuid(),
    name: faker.company.name(),
    safeCount: 0,
    members: [spaceMemberBuilder().build()],
  })
}
