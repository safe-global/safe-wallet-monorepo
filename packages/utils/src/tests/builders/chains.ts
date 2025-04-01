import { faker } from '@faker-js/faker'

import {
  BlockExplorerUriTemplate,
  Chain as ChainInfo,
  GasPriceFixed,
  GasPriceFixedEip1559,
  GasPriceOracle,
  NativeCurrency,
  RpcUri,
  Theme,
} from '@safe-global/store/gateway/AUTO_GENERATED/chains'

import { Builder } from '@safe-global/utils/tests/Builder'
import { generateRandomArray } from '@safe-global/utils/tests/utils'
import type { IBuilder } from '@safe-global/utils/tests/Builder'
import { FEATURES } from '@safe-global/utils/utils/chains'

const rpcUriBuilder = (): IBuilder<RpcUri> => {
  return Builder.new<RpcUri>().with({
    authentication: 'NO_AUTHENTICATION' as const,
    value: faker.internet.url({ appendSlash: false }),
  })
}

const blockExplorerUriTemplateBuilder = (): IBuilder<BlockExplorerUriTemplate> => {
  return Builder.new<BlockExplorerUriTemplate>().with({
    address: faker.internet.url({ appendSlash: false }),
    txHash: faker.internet.url({ appendSlash: false }),
    api: faker.internet.url({ appendSlash: false }),
  })
}

const nativeCurrencyBuilder = (): IBuilder<NativeCurrency> => {
  return Builder.new<NativeCurrency>().with({
    name: faker.finance.currencyName(),
    symbol: faker.finance.currencySymbol(),
    decimals: 18,
    logoUri: faker.internet.url({ appendSlash: false }),
  })
}

const themeBuilder = (): IBuilder<Theme> => {
  return Builder.new<Theme>().with({
    textColor: faker.color.rgb(),
    backgroundColor: faker.color.rgb(),
  })
}

const gasPriceFixedBuilder = (): IBuilder<GasPriceFixed> => {
  return Builder.new<GasPriceFixed>().with({
    type: 'FIXED',
    weiValue: faker.string.numeric(),
  })
}

const gasPriceFixedEIP1559Builder = (): IBuilder<GasPriceFixedEip1559> => {
  return Builder.new<GasPriceFixedEip1559>().with({
    type: 'FIXED_1559',
    maxFeePerGas: faker.string.numeric(),
    maxPriorityFeePerGas: faker.string.numeric(),
  })
}

const gasPriceOracleBuilder = (): IBuilder<GasPriceOracle> => {
  return Builder.new<GasPriceOracle>().with({
    type: 'ORACLE',
    uri: faker.internet.url({ appendSlash: false }),
    gasParameter: faker.word.sample(),
    gweiFactor: faker.string.numeric(),
  })
}

const getRandomGasPriceBuilder = () => {
  const gasPriceBuilders = [
    gasPriceFixedBuilder(),
    gasPriceFixedEIP1559Builder(),
    gasPriceOracleBuilder(),
    // gasPriceOracleUnknownBuilder(),
  ]

  const randomIndex = Math.floor(Math.random() * gasPriceBuilders.length)
  return gasPriceBuilders[randomIndex]
}

export const chainBuilder = (): IBuilder<ChainInfo> => {
  return Builder.new<ChainInfo>().with({
    chainId: faker.string.numeric(),
    chainLogoUri: faker.internet.url({ appendSlash: false }),
    chainName: faker.word.sample(),
    description: faker.word.words(),
    l2: faker.datatype.boolean(),
    shortName: faker.word.sample(),
    rpcUri: rpcUriBuilder().build(),
    safeAppsRpcUri: rpcUriBuilder().build(),
    publicRpcUri: rpcUriBuilder().build(),
    blockExplorerUriTemplate: blockExplorerUriTemplateBuilder().build(),
    nativeCurrency: nativeCurrencyBuilder().build(),
    transactionService: faker.internet.url({ appendSlash: false }),
    theme: themeBuilder().build(),
    gasPrice: generateRandomArray(() => getRandomGasPriceBuilder().build(), { min: 1, max: 4 }),
    ensRegistryAddress: faker.finance.ethereumAddress(),
    disabledWallets: generateRandomArray(() => faker.word.sample(), { min: 1, max: 10 }),
    features: generateRandomArray(() => faker.helpers.enumValue(FEATURES), { min: 1, max: 10 }),
    recommendedMasterCopyVersion: faker.system.semver(),
  })
}
