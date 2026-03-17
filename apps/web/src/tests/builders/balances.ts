import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { Balance, Balances, NativeToken, Erc20Token } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

import { Builder, type IBuilder } from '../Builder'

export const nativeTokenBuilder = (): IBuilder<NativeToken> => {
  return Builder.new<NativeToken>().with({
    address: checksumAddress(faker.finance.ethereumAddress()),
    decimals: 18,
    logoUri: faker.image.url(),
    name: 'Ether',
    symbol: 'ETH',
    type: 'NATIVE_TOKEN' as const,
  })
}

export const erc20TokenBuilder = (): IBuilder<Erc20Token> => {
  return Builder.new<Erc20Token>().with({
    address: checksumAddress(faker.finance.ethereumAddress()),
    decimals: faker.helpers.arrayElement([6, 8, 18]),
    logoUri: faker.image.url(),
    name: faker.finance.currencyName(),
    symbol: faker.finance.currencyCode(),
    type: 'ERC20' as const,
  })
}

export const tokenInfoBuilder = (): IBuilder<Erc20Token> => erc20TokenBuilder()

export const balanceBuilder = (): IBuilder<Balance> => {
  return Builder.new<Balance>().with({
    balance: faker.number.bigInt({ min: 1n, max: 10n ** 20n }).toString(),
    fiatBalance: faker.finance.amount(),
    fiatConversion: faker.finance.amount(),
    tokenInfo: erc20TokenBuilder().build(),
  })
}

export const balancesBuilder = (): IBuilder<Balances> => {
  return Builder.new<Balances>().with({
    fiatTotal: faker.finance.amount(),
    items: [balanceBuilder().build()],
  })
}
