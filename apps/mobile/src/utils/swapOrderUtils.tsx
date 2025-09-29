import React from 'react'
import { Logo } from '@/src/components/Logo'
import { View, Text } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { OrderTransactionInfo, StartTimeValue } from '@safe-global/store/gateway/types'
import { formatWithSchema, getPeriod } from '@safe-global/utils/utils/date'
import { formatValue, getLimitPrice, ellipsis } from '@/src/utils/formatters'
import { TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { CopyButton } from '@/src/components/CopyButton'
import {
  getExecutionPrice,
  getSlippageInPercent,
  getOrderClass,
  getOrderFeeBps,
  isOrderPartiallyFilled,
} from '@safe-global/utils/features/swap/helpers/utils'
import StatusLabel from '@/src/features/ConfirmTx/components/confirmation-views/SwapOrder/StatusLabel'
import { TouchableOpacity, Linking } from 'react-native'
import { type ListTableItem } from '@/src/features/ConfirmTx/components/ListTable'

export const priceRow = (order: OrderTransactionInfo) => {
  const { status, sellToken, buyToken } = order
  const executionPrice = getExecutionPrice(order)
  const limitPrice = getLimitPrice(order)

  if (status === 'fulfilled') {
    return {
      label: 'Execution price',
      value: `1 ${buyToken.symbol} = ${formatAmount(executionPrice)} ${sellToken.symbol}`,
    }
  }

  return {
    label: 'Limit price',
    value: `1 ${buyToken.symbol} = ${formatAmount(limitPrice)} ${sellToken.symbol}`,
  }
}

export const statusRow = (order: OrderTransactionInfo) => {
  const { status } = order
  const isPartiallyFilled = isOrderPartiallyFilled(order)
  return {
    label: 'Status',
    render: () => <StatusLabel status={isPartiallyFilled ? 'partiallyFilled' : status} />,
  }
}

export const expiryRow = (order: OrderTransactionInfo) => {
  const expiresAt = formatWithSchema(order.validUntil * 1000, 'dd/MM/yyyy, HH:mm')
  return {
    label: 'Expiry',
    value: expiresAt,
  }
}

export const orderIdRow = (order: OrderTransactionInfo) => {
  if (!('uid' in order)) {
    return null
  }

  const openCowExplorer = () => {
    Linking.openURL(order.explorerUrl)
  }

  return {
    label: 'Order ID',
    render: () => (
      <View flexDirection="row" alignItems="center" gap="$2">
        <Text fontSize="$4">{ellipsis(order.uid, 6)}</Text>
        <CopyButton value={order.uid} color={'$textSecondaryLight'} />
        <TouchableOpacity onPress={openCowExplorer}>
          <SafeFontIcon name="external-link" size={14} color="$textSecondaryLight" />
        </TouchableOpacity>
      </View>
    ),
  }
}

export const networkRow = (chain: Chain) => {
  return {
    label: 'Network',
    render: () => (
      <View flexDirection="row" alignItems="center" gap="$2">
        <Logo logoUri={chain.chainLogoUri} size="$6" />
        <Text fontSize="$4">{chain.chainName}</Text>
      </View>
    ),
  }
}

export const slippageRow = (order: OrderTransactionInfo) => {
  const orderClass = getOrderClass(order)
  const slippage = getSlippageInPercent(order)

  if (orderClass === 'limit') {
    return null
  }

  return {
    label: 'Slippage',
    value: `${slippage}%`,
  }
}

export const widgetFeeRow = (order: Pick<OrderTransactionInfo, 'fullAppData' | 'executedFee' | 'executedFeeToken'>) => {
  const bps = getOrderFeeBps(order)

  return {
    label: 'Widget fee',
    value: `${Number(bps) / 100} %`,
  }
}

export const totalFeesRow = (
  order: Pick<OrderTransactionInfo, 'executedFee' | 'executedFeeToken' | 'sellToken' | 'buyToken' | 'kind'>,
) => {
  const { executedFee, executedFeeToken, sellToken, buyToken, kind } = order

  // Only show if there are actual executed fees
  if (!executedFee || executedFee === '0' || !executedFeeToken) {
    return null
  }

  // executedFeeToken can be either a string or TokenInfo object
  // If it's a string, we need to determine the token from the order context
  let feeToken
  if (typeof executedFeeToken === 'string') {
    // For string type, fee is typically in surplus token (buy token for sell orders, sell token for buy orders)
    feeToken = kind === 'sell' ? buyToken : sellToken
  } else {
    // For TokenInfo type, use it directly
    feeToken = executedFeeToken
  }

  return {
    label: 'Total fees',
    value: `${formatValue(executedFee, feeToken.decimals)} ${feeToken.symbol}`,
  }
}

export const numberOfPartsRow = (order: { numberOfParts: string }) => {
  return {
    label: 'No of parts',
    value: order.numberOfParts,
  }
}

export const partSellAmountRow = (order: {
  partSellAmount: string
  sellToken: { decimals: number; symbol: string }
}) => {
  return {
    label: 'Sell amount',
    value: `${formatValue(order.partSellAmount, order.sellToken.decimals)} ${order.sellToken.symbol} per part`,
  }
}

export const partBuyAmountRow = (order: { minPartLimit: string; buyToken: { decimals: number; symbol: string } }) => {
  return {
    label: 'Buy amount',
    value: `${formatValue(order.minPartLimit, order.buyToken.decimals)} ${order.buyToken.symbol} per part`,
  }
}

export const formatSwapOrderItemsForConfirmation = (txInfo: OrderTransactionInfo, chain: Chain): ListTableItem[] => {
  const items = [
    priceRow(txInfo),
    expiryRow(txInfo),
    slippageRow(txInfo),
    orderIdRow(txInfo),
    networkRow(chain),
    statusRow(txInfo),
    widgetFeeRow(txInfo),
  ]

  return items.filter((item) => item !== null) as ListTableItem[]
}

export const formatSwapOrderItemsForHistory = (txInfo: OrderTransactionInfo, chain: Chain): ListTableItem[] => {
  const items = [priceRow(txInfo), orderIdRow(txInfo), networkRow(chain), statusRow(txInfo), totalFeesRow(txInfo)]

  return items.filter((item) => item !== null) as ListTableItem[]
}

export const formatTwapOrderItemsForHistory = (order: TwapOrderTransactionInfo, chain: Chain): ListTableItem[] => {
  const items = [
    priceRow(order),
    numberOfPartsRow(order),
    partSellAmountRow(order),
    partBuyAmountRow(order),
    expiryRow(order),
    orderIdRow(order),
    networkRow(chain),
    statusRow(order),
    totalFeesRow(order),
  ]

  return items.filter((item) => item !== null) as ListTableItem[]
}

export const formatTwapOrderItemsForConfirmation = (order: TwapOrderTransactionInfo) => {
  const { timeBetweenParts } = order
  let startTime = ''
  if (order.startTime.startType === StartTimeValue.AT_MINING_TIME) {
    startTime = 'Now'
  }
  if (order.startTime.startType === StartTimeValue.AT_EPOCH) {
    startTime = `At block number: ${order.startTime.epoch}`
  }

  return [
    {
      renderRow: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Text fontSize="$4">Order will be split in</Text>
          <Text fontSize="$4" fontWeight={'700'}>
            {order.numberOfParts} equal parts
          </Text>
        </View>
      ),
    },
    partSellAmountRow(order),
    partBuyAmountRow(order),
    {
      label: 'Start time',
      value: startTime,
    },
    {
      label: 'Part duration',
      value: getPeriod(+timeBetweenParts),
    },
    {
      label: 'Total duration',
      value: getPeriod(+order.timeBetweenParts * +order.numberOfParts),
    },
  ]
}
