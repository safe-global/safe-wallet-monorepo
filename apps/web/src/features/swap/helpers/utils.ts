import type { DataDecoded, Order as SwapOrder } from '@safe-global/safe-gateway-typescript-sdk'
import { formatUnits } from 'ethers'
import type { AnyAppDataDocVersion, latest, LatestAppDataDocVersion } from '@cowprotocol/app-data'

import { TradeType, UiOrderType } from '@safe-global/utils/features/swap/types'

type Quantity = {
  amount: string | number | bigint
  decimals: number
}

export enum OrderKind {
  SELL = 'sell',
  BUY = 'buy',
}

function calculateDifference(amountA: string, amountB: string, decimals: number): number {
  return asDecimal(BigInt(amountA), decimals) - asDecimal(BigInt(amountB), decimals)
}

function asDecimal(amount: number | bigint, decimals: number): number {
  return Number(formatUnits(amount, decimals))
}

export const TWAP_FALLBACK_HANDLER = '0x2f55e8b20D0B9FEFA187AA7d00B6Cbe563605bF5'

// https://github.com/cowprotocol/composable-cow/blob/main/networks.json
export const TWAP_FALLBACK_HANDLER_NETWORKS = ['1', '100', '11155111', '42161']

export const getExecutionPrice = (
  order: Pick<SwapOrder, 'executedSellAmount' | 'executedBuyAmount' | 'buyToken' | 'sellToken'>,
): number => {
  const { executedSellAmount, executedBuyAmount, buyToken, sellToken } = order

  const ratio = calculateRatio(
    { amount: executedSellAmount || '0', decimals: sellToken.decimals },
    {
      amount: executedBuyAmount || '0',
      decimals: buyToken.decimals,
    },
  )

  return ratio
}

export const getLimitPrice = (
  order: Pick<SwapOrder, 'sellAmount' | 'buyAmount' | 'buyToken' | 'sellToken'>,
): number => {
  const { sellAmount, buyAmount, buyToken, sellToken } = order

  const ratio = calculateRatio(
    { amount: sellAmount, decimals: sellToken.decimals },
    { amount: buyAmount, decimals: buyToken.decimals },
  )

  return ratio
}

const calculateRatio = (a: Quantity, b: Quantity) => {
  if (BigInt(b.amount) === 0n) {
    return 0
  }
  return asDecimal(BigInt(a.amount), a.decimals) / asDecimal(BigInt(b.amount), b.decimals)
}

export const getSurplusPrice = (
  order: Pick<
    SwapOrder,
    'executedBuyAmount' | 'buyAmount' | 'buyToken' | 'executedSellAmount' | 'sellAmount' | 'sellToken' | 'kind'
  >,
): number => {
  const { kind, executedSellAmount, sellAmount, sellToken, executedBuyAmount, buyAmount, buyToken } = order
  if (kind === OrderKind.BUY) {
    return calculateDifference(sellAmount, executedSellAmount || '', sellToken.decimals)
  } else if (kind === OrderKind.SELL) {
    return calculateDifference(executedBuyAmount || '', buyAmount, buyToken.decimals)
  } else {
    return 0
  }
}

export const getPartiallyFilledSurplus = (order: SwapOrder): number => {
  if (order.kind === OrderKind.BUY) {
    return getPartiallyFilledBuySurplus(order)
  } else if (order.kind === OrderKind.SELL) {
    return getPartiallyFilledSellSurplus(order)
  } else {
    return 0
  }
}

const getPartiallyFilledBuySurplus = (
  order: Pick<
    SwapOrder,
    'executedBuyAmount' | 'buyAmount' | 'buyToken' | 'executedSellAmount' | 'sellAmount' | 'sellToken' | 'kind'
  >,
): number => {
  const { executedSellAmount, sellAmount, sellToken, executedBuyAmount, buyAmount, buyToken } = order

  const limitPrice = calculateRatio(
    { amount: sellAmount, decimals: sellToken.decimals },
    { amount: buyAmount, decimals: buyToken.decimals },
  )
  const maximumSellAmount = asDecimal(BigInt(executedBuyAmount || 0n), buyToken.decimals) * limitPrice
  return maximumSellAmount - asDecimal(BigInt(executedSellAmount || 0n), sellToken.decimals)
}

const getPartiallyFilledSellSurplus = (
  order: Pick<
    SwapOrder,
    'executedBuyAmount' | 'buyAmount' | 'buyToken' | 'executedSellAmount' | 'sellAmount' | 'sellToken' | 'kind'
  >,
): number => {
  const { executedSellAmount, sellAmount, sellToken, executedBuyAmount, buyAmount, buyToken } = order

  const limitPrice = calculateRatio(
    { amount: buyAmount, decimals: buyToken.decimals },
    { amount: sellAmount, decimals: sellToken.decimals },
  )

  const minimumBuyAmount = asDecimal(BigInt(executedSellAmount || 0n), sellToken.decimals) * limitPrice
  return asDecimal(BigInt(executedBuyAmount || 0n), buyToken.decimals) - minimumBuyAmount
}

export const getFilledPercentage = (
  order: Pick<SwapOrder, 'executedBuyAmount' | 'kind' | 'buyAmount' | 'executedSellAmount' | 'sellAmount'>,
): string => {
  let executed: number
  let total: number

  if (order.kind === OrderKind.BUY) {
    executed = Number(order.executedBuyAmount)
    total = Number(order.buyAmount)
  } else if (order.kind === OrderKind.SELL) {
    executed = Number(order.executedSellAmount)
    total = Number(order.sellAmount)
  } else {
    return '0'
  }

  return ((executed / total) * 100).toFixed(0)
}

export const getFilledAmount = (
  order: Pick<SwapOrder, 'kind' | 'executedBuyAmount' | 'executedSellAmount' | 'buyToken' | 'sellToken'>,
): string => {
  if (order.kind === OrderKind.BUY) {
    return formatUnits(order.executedBuyAmount || 0n, order.buyToken.decimals)
  } else if (order.kind === OrderKind.SELL) {
    return formatUnits(order.executedSellAmount || 0n, order.sellToken.decimals)
  } else {
    return '0'
  }
}

export const getSlippageInPercent = (order: Pick<SwapOrder, 'fullAppData'>): string => {
  const fullAppData = order.fullAppData as AnyAppDataDocVersion
  const slippageBips = (fullAppData?.metadata?.quote as latest.Quote)?.slippageBips || 0

  return (Number(slippageBips) / 100).toFixed(2)
}

export const getOrderClass = (order: Pick<SwapOrder, 'fullAppData'>): latest.OrderClass1 => {
  const fullAppData = order.fullAppData as AnyAppDataDocVersion
  const orderClass = (fullAppData?.metadata?.orderClass as latest.OrderClass)?.orderClass

  return orderClass || 'market'
}

export const getOrderFeeBps = (order: Pick<SwapOrder, 'fullAppData'>): number => {
  const fullAppData = order.fullAppData as unknown as LatestAppDataDocVersion
  const basisPoints = (fullAppData?.metadata?.partnerFee as latest.PartnerFee)?.bps

  return Number(basisPoints) || 0
}

export const isOrderPartiallyFilled = (
  order: Pick<SwapOrder, 'executedBuyAmount' | 'executedSellAmount' | 'sellAmount' | 'buyAmount' | 'kind'>,
): boolean => {
  const executedBuyAmount = BigInt(order.executedBuyAmount || 0)
  const buyAmount = BigInt(order.buyAmount)
  const executedSellAmount = BigInt(order.executedSellAmount || 0)
  const sellAmount = BigInt(order.sellAmount)

  if (order.kind === OrderKind.BUY) {
    return executedBuyAmount !== 0n && executedBuyAmount < buyAmount
  }

  return BigInt(executedSellAmount) !== 0n && executedSellAmount < sellAmount
}

export const UiOrderTypeToOrderType = (orderType: UiOrderType): TradeType => {
  switch (orderType) {
    case UiOrderType.SWAP:
      return TradeType.SWAP
    case UiOrderType.LIMIT:
      return TradeType.LIMIT
    case UiOrderType.TWAP:
      return TradeType.ADVANCED
  }
}

export const isSettingTwapFallbackHandler = (decodedData: DataDecoded) => {
  return (
    decodedData.parameters?.some(
      (item) =>
        Array.isArray(item?.valueDecoded) &&
        item.valueDecoded.some(
          (decoded) =>
            decoded.dataDecoded?.method === 'setFallbackHandler' &&
            decoded.dataDecoded.parameters?.some(
              (parameter) => parameter.name === 'handler' && parameter.value === TWAP_FALLBACK_HANDLER,
            ),
        ),
    ) || false
  )
}
