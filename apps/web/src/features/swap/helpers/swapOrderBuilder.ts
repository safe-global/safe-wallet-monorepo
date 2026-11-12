import type { TransactionInfoType, OrderTransactionInfo } from '@safe-global/store/gateway/types'
import type { TokenInfo, SwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Builder, type IBuilder } from '@/tests/Builder'
import { mockAddress } from '@/stories/mocks/address'

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

export function orderTokenBuilder(): IBuilder<TokenInfo> {
  return Builder.new<TokenInfo>().with({
    address: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
    decimals: 18,
    logoUri:
      'https://safe-transaction-assets.staging.5afe.dev/tokens/logos/0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14.png',
    name: 'Wrapped Ether',
    symbol: 'WETH',
    trusted: true,
  })
}

// create a builder for SwapOrderConfirmationView
export function swapOrderConfirmationViewBuilder(): IBuilder<OrderTransactionInfo> {
  const ownerAndReceiver = mockAddress(1)
  return Builder.new<SwapOrderTransactionInfo>().with({
    type: 'SwapOrder' as TransactionInfoType.SWAP_ORDER,
    uid: '0x03a5d561ad2452d719a0d075573f4bed68217c696b52f151122c30e3e4426f1b05e6b5eb1d0e6aabab082057d5bb91f2ee6d11be66223d88',
    kind: 'sell',
    orderClass: 'market',
    validUntil: 1735001680,
    status: 'open',
    sellToken: orderTokenBuilder().build(),
    buyToken: orderTokenBuilder().build(),
    sellAmount: '10000000',
    buyAmount: '3500000000000000',
    executedSellAmount: '10000000',
    executedBuyAmount: '3500000000000000',
    receiver: ownerAndReceiver,
    owner: ownerAndReceiver,
    explorerUrl:
      'https://explorer.cow.fi/orders/0x03a5d561ad2452d719a0d075573f4bed68217c696b52f151122c30e3e4426f1b05e6b5eb1d0e6aabab082057d5bb91f2ee6d11be66223d88',
    fullAppData: appDataBuilder().build(),
  })
}
