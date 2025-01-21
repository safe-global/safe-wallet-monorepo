import { Builder, type IBuilder } from '@/tests/Builder'
import { faker } from '@faker-js/faker'
import type {
  OrderToken,
  SwapOrder,
  TransactionInfoType,
  TwapOrder,
  Order,
} from '@safe-global/safe-gateway-typescript-sdk'
import { DurationType, StartTimeValue } from '@safe-global/safe-gateway-typescript-sdk'

export function appDataBuilder(
  orderClass: 'limit' | 'market' | 'twap' | 'liquidity' = 'limit',
): IBuilder<Record<string, unknown>> {
  return Builder.new<Record<string, unknown>>().with({
    appCode: 'Safe Wallet Swaps',
    metadata: {
      orderClass: {
        orderClass,
      },
      partnerFee: {
        bps: 50,
        recipient: '0x0B00b3227A5F3df3484f03990A87e02EbaD2F888',
      },
      quote: {
        slippageBips: 50,
      },
      widget: {
        appCode: 'CoW Swap-SafeApp',
        environment: 'production',
      },
    },
    version: '1.1.0',
  })
}

export function orderTokenBuilder(): IBuilder<OrderToken> {
  return Builder.new<OrderToken>().with({
    address: faker.finance.ethereumAddress(),
    decimals: faker.number.int({ max: 18 }),
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14.png',
    name: faker.finance.currencyName(),
    symbol: faker.finance.currencyCode(),
    trusted: faker.datatype.boolean(),
  })
}

export function swapOrderBuilder(): IBuilder<SwapOrder> {
  const sellToken = orderTokenBuilder().build()
  const executedFee = faker.string.numeric()
  return Builder.new<SwapOrder>().with({
    type: 'SwapOrder' as TransactionInfoType.SWAP_ORDER,
    uid: faker.string.uuid(),
    status: faker.helpers.arrayElement(['presignaturePending', 'open', 'cancelled', 'fulfilled', 'expired']),
    kind: faker.helpers.arrayElement(['buy', 'sell']),
    orderClass: faker.helpers.arrayElement(['limit', 'market', 'liquidity']),
    validUntil: faker.date.future().getTime(),
    sellAmount: faker.string.numeric(),
    buyAmount: faker.string.numeric(),
    executedSellAmount: faker.string.numeric(),
    executedBuyAmount: faker.string.numeric(),
    sellToken,
    buyToken: orderTokenBuilder().build(),
    explorerUrl:
      'https://explorer.cow.fi/orders/0x03a5d561ad2452d719a0d075573f4bed68217c696b52f151122c30e3e4426f1b05e6b5eb1d0e6aabab082057d5bb91f2ee6d11be66223d88',
    executedSurplusFee: executedFee,
    executedFee,
    executedFeeToken: sellToken,
    fullAppData: appDataBuilder().build(),
  })
}

export function twapOrderBuilder(): IBuilder<TwapOrder> {
  const sellToken = orderTokenBuilder().build()
  const executedFee = faker.string.numeric()
  return Builder.new<TwapOrder>().with({
    type: 'TwapOrder' as TransactionInfoType.TWAP_ORDER,
    status: faker.helpers.arrayElement(['presignaturePending', 'open', 'cancelled', 'fulfilled', 'expired']),
    kind: faker.helpers.arrayElement(['buy', 'sell']),
    orderClass: faker.helpers.arrayElement(['limit', 'market', 'liquidity']),
    validUntil: faker.date.future().getTime(),
    sellAmount: faker.string.numeric(),
    buyAmount: faker.string.numeric(),
    executedSellAmount: faker.string.numeric(),
    executedBuyAmount: faker.string.numeric(),
    sellToken: orderTokenBuilder().build(),
    buyToken: orderTokenBuilder().build(),
    executedSurplusFee: executedFee,
    executedFee,
    executedFeeToken: sellToken,
    fullAppData: appDataBuilder().build(),
    numberOfParts: faker.number.int({ min: 1, max: 10 }).toString(),
    /** @description The amount of sellToken to sell in each part */
    partSellAmount: faker.string.numeric(),
    /** @description The amount of buyToken that must be bought in each part */
    minPartLimit: faker.string.numeric(),
    /** @description The duration of the TWAP interval */
    timeBetweenParts: faker.number.int({ min: 1, max: 10000000 }),
    /** @description Whether the TWAP is valid for the entire interval or not */
    durationOfPart: {
      durationType: DurationType.AUTO,
    },
    /** @description The start time of the TWAP */
    startTime: {
      startType: StartTimeValue.AT_MINING_TIME,
    },
  })
}

// create a builder for SwapOrderConfirmationView
export function swapOrderConfirmationViewBuilder(): IBuilder<Order> {
  const ownerAndReceiver = faker.finance.ethereumAddress()
  return Builder.new<Order>().with({
    type: 'SwapOrder' as TransactionInfoType.SWAP_ORDER,
    uid: faker.string.uuid(),
    kind: faker.helpers.arrayElement(['buy', 'sell']),
    orderClass: faker.helpers.arrayElement(['limit', 'market', 'liquidity']),
    validUntil: faker.date.future().getTime(),
    status: faker.helpers.arrayElement(['presignaturePending', 'open', 'cancelled', 'fulfilled', 'expired']),
    sellToken: orderTokenBuilder().build(),
    buyToken: orderTokenBuilder().build(),
    sellAmount: faker.string.numeric(),
    buyAmount: faker.string.numeric(),
    executedSellAmount: faker.string.numeric(),
    executedBuyAmount: faker.string.numeric(),
    receiver: ownerAndReceiver,
    owner: ownerAndReceiver,
    explorerUrl:
      'https://explorer.cow.fi/orders/0x03a5d561ad2452d719a0d075573f4bed68217c696b52f151122c30e3e4426f1b05e6b5eb1d0e6aabab082057d5bb91f2ee6d11be66223d88',
    fullAppData: appDataBuilder().build(),
  })
}
