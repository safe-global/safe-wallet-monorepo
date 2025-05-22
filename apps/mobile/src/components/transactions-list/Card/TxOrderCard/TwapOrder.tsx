import { Transaction, TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeListItem } from '@/src/components/SafeListItem'
import { Avatar, Text, Theme, View } from 'tamagui'
import { ellipsis, formatValue } from '@/src/utils/formatters'
import React from 'react'

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
            ~{ellipsis(formatValue(order.buyAmount, order.buyToken.decimals), 10)} {order.buyToken.symbol}
          </Text>
          <Text fontSize="$3">
            −{ellipsis(formatValue(order.sellAmount, order.sellToken.decimals), 10)} {order.sellToken.symbol}
          </Text>
        </View>
      }
    />
  )
}
