import { faker } from '@faker-js/faker'
import { RPC_AUTHENTICATION, GAS_PRICE_TYPE } from '@safe-global/safe-gateway-typescript-sdk'
import type {
  BlockExplorerUriTemplate,
  ChainInfo,
  GasPriceFixed,
  GasPriceFixedEIP1559,
  GasPriceOracle,
  GasPriceUnknown,
  NativeCurrency,
  RpcUri,
  Theme,
} from '@safe-global/safe-gateway-typescript-sdk'

import { Builder } from '@/tests/Builder'
import { generateRandomArray } from './utils'
import type { IBuilder } from '@/tests/Builder'
import type useChains from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const rpcUriBuilder = (): IBuilder<RpcUri> => {
  return Builder.new<RpcUri>().with({
    authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION,
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
    type: GAS_PRICE_TYPE.FIXED,
    weiValue: faker.string.numeric(),
  })
}

const gasPriceFixedEIP1559Builder = (): IBuilder<GasPriceFixedEIP1559> => {
  return Builder.new<GasPriceFixedEIP1559>().with({
    type: GAS_PRICE_TYPE.FIXED_1559,
    maxFeePerGas: faker.string.numeric(),
    maxPriorityFeePerGas: faker.string.numeric(),
  })
}

const gasPriceOracleBuilder = (): IBuilder<GasPriceOracle> => {
  return Builder.new<GasPriceOracle>().with({
    type: GAS_PRICE_TYPE.ORACLE,
    uri: faker.internet.url({ appendSlash: false }),
    gasParameter: faker.word.sample(),
    gweiFactor: faker.string.numeric(),
  })
}

const gasPriceOracleUnknownBuilder = (): IBuilder<GasPriceUnknown> => {
  return Builder.new<GasPriceUnknown>().with({
    type: GAS_PRICE_TYPE.UNKNOWN,
  })
}

const getRandomGasPriceBuilder = () => {
  const gasPriceBuilders = [
    gasPriceFixedBuilder(),
    gasPriceFixedEIP1559Builder(),
    gasPriceOracleBuilder(),
    gasPriceOracleUnknownBuilder(),
  ]

  const randomIndex = Math.floor(Math.random() * gasPriceBuilders.length)
  return gasPriceBuilders[randomIndex]
}

export const chainBuilder = (): IBuilder<ChainInfo> => {
  return Builder.new<ChainInfo>().with({
    chainId: faker.string.numeric(),
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
    // @ts-expect-error - we are using a local FEATURES enum
    features: generateRandomArray(() => faker.helpers.enumValue(FEATURES), { min: 1, max: 10 }),
    recommendedMasterCopyVersion: faker.system.semver(),
  })
}

export const useChainsBuilder = (): IBuilder<ReturnType<typeof useChains>> => {
  return Builder.new<ReturnType<typeof useChains>>().with({
    configs: generateRandomArray(() => chainBuilder().build(), { min: 1, max: 25 }),
    loading: false,
  })
}
