import { SafeListItem } from '@/src/components/SafeListItem'
import { Avatar, Text, Theme, View } from 'tamagui'
import { formatValue } from '@/src/utils/formatters'
import React from 'react'
import {
  SwapOrderTransactionInfo,
  SwapTransferTransactionInfo,
  Transaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface TxSellOrderCardProps {
  order: SwapOrderTransactionInfo | SwapTransferTransactionInfo
  bordered?: boolean
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: () => void
}

export function SellOrder({ order, bordered, executionInfo, inQueue, onPress }: TxSellOrderCardProps) {
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
            ~{formatValue(order.buyAmount, order.buyToken.decimals)} {order.buyToken.symbol}
          </Text>
          <Text fontSize="$3">
            −{formatValue(order.sellAmount, order.sellToken.decimals)} {order.sellToken.symbol}
          </Text>
        </View>
      }
    />
  )
}
