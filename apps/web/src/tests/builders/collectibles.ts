import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'

import { Builder, type IBuilder } from '../Builder'

export const collectibleBuilder = (): IBuilder<Collectible> => {
  return Builder.new<Collectible>().with({
    address: checksumAddress(faker.finance.ethereumAddress()),
    tokenName: faker.word.words(2),
    tokenSymbol: faker.string.alpha({ length: { min: 3, max: 5 }, casing: 'upper' }),
    logoUri: faker.image.url(),
    id: faker.string.numeric({ length: { min: 1, max: 5 } }),
    uri: faker.internet.url(),
    name: faker.word.words(3),
    description: faker.lorem.sentence(),
    imageUri: faker.image.url(),
    metadata: null,
  })
}
