import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { faker } from '@faker-js/faker'
import { Builder, type IBuilder } from '../Builder'

export function eip712TypedDataBuilder(): IBuilder<TypedData> {
  return Builder.new<TypedData>().with({
    domain: {
      chainId: faker.number.int({ min: 1, max: 10000 }),
      name: faker.string.alpha(),
      verifyingContract: faker.finance.ethereumAddress(),
    },
    types: {
      Test: [
        {
          name: 'example',
          type: 'uint8',
        },
      ],
    },
    message: {
      example: '8',
    },
  })
}
