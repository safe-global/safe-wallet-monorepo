import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type {
  Erc20TokenMetadata,
  Erc721TokenMetadata,
  NativeTokenMetadata,
} from '@safe-global/store/gateway/AUTO_GENERATED/tokens'

import { Builder, type IBuilder } from '../Builder'

export const erc20TokenMetadataBuilder = (): IBuilder<Erc20TokenMetadata> => {
  return Builder.new<Erc20TokenMetadata>().with({
    address: checksumAddress(faker.finance.ethereumAddress()),
    decimals: faker.helpers.arrayElement([6, 8, 18]),
    logoUri: faker.image.url(),
    name: faker.finance.currencyName(),
    symbol: faker.finance.currencyCode(),
    trusted: true,
    type: 'ERC20' as const,
  })
}

export const nativeTokenMetadataBuilder = (): IBuilder<NativeTokenMetadata> => {
  return Builder.new<NativeTokenMetadata>().with({
    address: checksumAddress(faker.finance.ethereumAddress()),
    decimals: 18,
    logoUri: faker.image.url(),
    name: 'Ether',
    symbol: 'ETH',
    trusted: true,
    type: 'NATIVE_TOKEN' as const,
  })
}

export const erc721TokenMetadataBuilder = (): IBuilder<Erc721TokenMetadata> => {
  return Builder.new<Erc721TokenMetadata>().with({
    address: checksumAddress(faker.finance.ethereumAddress()),
    decimals: 0,
    logoUri: faker.image.url(),
    name: faker.commerce.productName(),
    symbol: faker.finance.currencyCode(),
    trusted: false,
    type: 'ERC721' as const,
  })
}
