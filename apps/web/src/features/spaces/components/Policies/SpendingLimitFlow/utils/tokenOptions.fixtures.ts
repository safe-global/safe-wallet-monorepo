import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { Builder, type IBuilder } from '@/tests/Builder'
import type { TokenOption } from './tokenOptions'

export const tokenOptionBuilder = (): IBuilder<TokenOption> => {
  return Builder.new<TokenOption>().with({
    address: checksumAddress(faker.finance.ethereumAddress()),
    symbol: faker.finance.currencyCode(),
    name: faker.finance.currencyName(),
    decimals: 18,
    logoUri: faker.image.url(),
    group: 'popular',
  })
}
