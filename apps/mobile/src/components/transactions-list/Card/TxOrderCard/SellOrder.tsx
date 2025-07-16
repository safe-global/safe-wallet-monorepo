import { SafeListItem } from '@/src/components/SafeListItem'
import { Text, Theme, View } from 'tamagui'
import { ellipsis, formatValue } from '@/src/utils/formatters'
import { TokenIcon } from '@/src/components/TokenIcon'
import React from 'react'
import {
  SwapOrderTransactionInfo,
  SwapTransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type TxSellOrderCardProps = {
  order: SwapOrderTransactionInfo | SwapTransferTransactionInfo
  type: string
} & Partial<SafeListItemProps>

export function SellOrder({ order, type, ...rest }: TxSellOrderCardProps) {
  return (
    <SafeListItem
      label={`${order.sellToken.symbol} > ${order.buyToken.symbol}`}
      icon="transaction-swap"
      type={type}
      leftNode={
        <Theme name="logo">
          <View position="relative" width="$10" height="$10">
            <View position="absolute" top={0}>
              <TokenIcon
                logoUri={order.sellToken.logoUri}
                accessibilityLabel={order.sellToken.name}
                size="$7"
                imageBackground="$background"
              />
            </View>

            <View position="absolute" bottom={0} right={0}>
              <TokenIcon
                logoUri={order.buyToken.logoUri}
                accessibilityLabel={order.buyToken.name}
                size="$7"
                imageBackground="$background"
              />
            </View>
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
      {...rest}
    />
  )
}
