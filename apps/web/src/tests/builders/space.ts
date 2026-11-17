import type {
  GetSpaceResponse,
  SpaceAddressBookItemDto,
  SpaceAddressBookTagDto,
  SpaceMemberDto,
  UserDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { checksumAddress } from '@safe-global/utils/utils/addresses'

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
    memberCount: 1,
    members: [spaceMemberBuilder().build()],
    experimentalFeatures: [],
  })
}

const TAG_COLORS: SpaceAddressBookTagDto['color'][] = [
  'slate',
  'clay',
  'rose',
  'lilac',
  'iris',
  'cobalt',
  'sky',
  'lagoon',
]

export function spaceAddressBookTagBuilder(): IBuilder<SpaceAddressBookTagDto> {
  return Builder.new<SpaceAddressBookTagDto>().with({
    id: faker.number.int({ min: 1, max: 1_000_000 }),
    name: faker.string.alpha({ length: { min: 3, max: 12 } }),
    color: faker.helpers.arrayElement(TAG_COLORS),
    contactCount: faker.number.int({ min: 0, max: 20 }),
  })
}

/** Tags with distinct ids, names and colours, as a space has them; at most 8. */
export const buildSpaceAddressBookTags = (count: number): SpaceAddressBookTagDto[] =>
  faker.helpers
    .shuffle(TAG_COLORS)
    .slice(0, count)
    .map((color, index) =>
      spaceAddressBookTagBuilder()
        .with({ id: index + 1, name: `${faker.word.noun()} ${index}`, color })
        .build(),
    )

export function spaceAddressBookItemBuilder(): IBuilder<SpaceAddressBookItemDto> {
  return Builder.new<SpaceAddressBookItemDto>().with({
    name: faker.person.fullName(),
    address: checksumAddress(faker.finance.ethereumAddress()),
    chainIds: ['1'],
    tagIds: [],
    createdBy: faker.internet.email(),
    createdByUserId: faker.number.int({ min: 1, max: 1000 }),
    lastUpdatedBy: faker.internet.email(),
    lastUpdatedByUserId: faker.number.int({ min: 1, max: 1000 }),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  })
}
