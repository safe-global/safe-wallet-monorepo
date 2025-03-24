import React from 'react'
import { Avatar, Text, Theme, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { formatValue } from '@/src/utils/formatters'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import {
  SwapOrderTransactionInfo,
  SwapTransferTransactionInfo,
  Transaction,
  TwapOrderTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isSwapOrderTxInfo, isSwapTransferOrderTxInfo, isTwapOrderTxInfo } from '@/src/utils/transaction-guards'

interface TxSwapCardProps {
  txInfo: OrderTransactionInfo
  bordered?: boolean
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: () => void
}

interface TxTwappOrderCardProps {
  order: TwapOrderTransactionInfo
  bordered?: boolean
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: () => void
}

export const TwapOrder = ({ order, bordered, executionInfo, inQueue, onPress }: TxTwappOrderCardProps) => {
  return (
    <SafeListItem
      label={`${order.sellToken.symbol} > ${order.buyToken.symbol}`}
      icon="transaction-swap"
      type="Twap order"
      executionInfo={executionInfo}
      bordered={bordered}
      onPress={onPress}
      inQueue={inQueue}
      leftNode={
        <Theme name="logo">
          <View position="relative" width="$10" height="$10">
            <Avatar circular size="$7" position="absolute" top={0}>
              {order.sellToken.logoUri && (
                <Avatar.Image
                  backgroundColor="$background"
                  accessibilityLabel={order.sellToken.name}
                  src={order.sellToken.logoUri}
                />
              )}
              <Avatar.Fallback backgroundColor="$background" />
            </Avatar>

            <Avatar circular size="$7" position="absolute" bottom={0} right={0} backgroundColor="$color">
              {order.buyToken.logoUri && (
                <Avatar.Image
                  accessibilityLabel={order.buyToken.name}
                  backgroundColor="$background"
                  src={order.buyToken.logoUri}
                />
              )}
              <Avatar.Fallback backgroundColor="$background" />
            </Avatar>
          </View>
        </Theme>
      }
      rightNode={
        <View alignItems="flex-end">
          <Text color="$primary">
            +{formatValue(order.buyAmount, order.buyToken.decimals)} {order.buyToken.symbol}
          </Text>
          <Text fontSize="$3">
            −{formatValue(order.sellAmount, order.sellToken.decimals)} {order.sellToken.symbol}
          </Text>
        </View>
      }
    />
  )
}

interface TxSellOrderCardProps {
  order: SwapOrderTransactionInfo | SwapTransferTransactionInfo
  bordered?: boolean
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: () => void
}

function SellOrder({ order, bordered, executionInfo, inQueue, onPress }: TxSellOrderCardProps) {
  return (
    <SafeListItem
      label={`${order.sellToken.symbol} > ${order.buyToken.symbol}`}
      icon="transaction-swap"
      type="Swap order"
      executionInfo={executionInfo}
      bordered={bordered}
      onPress={onPress}
      inQueue={inQueue}
      leftNode={
        <Theme name="logo">
          <View position="relative" width="$10" height="$10">
            <Avatar circular size="$7" position="absolute" top={0}>
              {order.sellToken.logoUri && (
                <Avatar.Image
                  backgroundColor="$background"
                  accessibilityLabel={order.sellToken.name}
                  src={order.sellToken.logoUri}
                />
              )}
              <Avatar.Fallback backgroundColor="$background" />
            </Avatar>

            <Avatar circular size="$7" position="absolute" bottom={0} right={0} backgroundColor="$color">
              {order.buyToken.logoUri && (
                <Avatar.Image
                  accessibilityLabel={order.buyToken.name}
                  backgroundColor="$background"
                  src={order.buyToken.logoUri}
                />
              )}
              <Avatar.Fallback backgroundColor="$background" />
            </Avatar>
          </View>
        </Theme>
      }
      rightNode={
        <View alignItems="flex-end">
          <Text color="$primary">
            +{formatValue(order.buyAmount, order.buyToken.decimals)} {order.buyToken.symbol}
          </Text>
          <Text fontSize="$3">
            −{formatValue(order.sellAmount, order.sellToken.decimals)} {order.sellToken.symbol}
          </Text>
        </View>
      }
    />
  )
}

export function TxOrderCard({ txInfo, bordered, executionInfo, inQueue, onPress }: TxSwapCardProps) {
  // return SwapOrderItem(txInfo, executionInfo, bordered, onPress, inQueue)

  if (!txInfo) {
    return null
  }

  if (isTwapOrderTxInfo(txInfo)) {
    return (
      <TwapOrder order={txInfo} bordered={bordered} executionInfo={executionInfo} inQueue={inQueue} onPress={onPress} />
    )
  }

  if (isSwapOrderTxInfo(txInfo) || isSwapTransferOrderTxInfo(txInfo)) {
    return (
      <SellOrder order={txInfo} bordered={bordered} executionInfo={executionInfo} inQueue={inQueue} onPress={onPress} />
    )
  }
  return null
}
