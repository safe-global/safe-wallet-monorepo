import type { ExtendedSafeInfo } from '@/store/safeInfoSlice'
import { faker } from '@faker-js/faker'
import { ImplementationVersionState } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeInfo, AddressEx } from '@safe-global/safe-gateway-typescript-sdk'

import { Builder } from '../Builder'
import { generateRandomArray } from './utils'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { IBuilder } from '../Builder'

const MAX_OWNERS_LENGTH = 10

export function addressExBuilder(): IBuilder<AddressEx> {
  return Builder.new<AddressEx>().with({
    value: checksumAddress(faker.finance.ethereumAddress()),
    name: faker.word.words(),
    logoUri: faker.image.url(),
  })
}

export function safeInfoBuilder(): IBuilder<SafeInfo> {
  const chainId = faker.helpers.arrayElement(['1', '11155111', '100', '10', '137'])
  return Builder.new<SafeInfo>().with({
    address: addressExBuilder().build(),
    chainId,
    nonce: faker.number.int(),
    threshold: faker.number.int(),
    owners: generateRandomArray(() => addressExBuilder().build(), { min: 1, max: MAX_OWNERS_LENGTH }),
    implementation: undefined,
    implementationVersionState: ImplementationVersionState.UP_TO_DATE,
    modules: [],
    guard: null,
    fallbackHandler: addressExBuilder().build(),
    version: '1.4.1',
    collectiblesTag: faker.string.numeric(),
    txQueuedTag: faker.string.numeric(),
    txHistoryTag: faker.string.numeric(),
    messagesTag: faker.string.numeric(),
  })
}

export function extendedSafeInfoBuilder(): IBuilder<ExtendedSafeInfo> {
  return Builder.new<ExtendedSafeInfo>().with({
    ...safeInfoBuilder().build(),
    deployed: true,
  })
}
