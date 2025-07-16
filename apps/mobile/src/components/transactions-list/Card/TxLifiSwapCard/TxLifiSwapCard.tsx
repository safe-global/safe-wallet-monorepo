import { SafeListItem } from '@/src/components/SafeListItem'
import { Text, Theme, View } from 'tamagui'
import { ellipsis, formatValue } from '@/src/utils/formatters'
import { TokenIcon } from '@/src/components/TokenIcon'
import React from 'react'
import { SwapTransactionInfo, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface TxLifiSwapCardProps {
  txInfo: SwapTransactionInfo
  bordered?: boolean
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: () => void
}

export function TxLifiSwapCard({ txInfo, bordered, executionInfo, inQueue, onPress }: TxLifiSwapCardProps) {
  const fromAmountFormatted = formatValue(txInfo.fromAmount, txInfo.fromToken.decimals)
  const toAmountFormatted = formatValue(txInfo.toAmount, txInfo.toToken.decimals)

  return (
    <SafeListItem
      label={`${txInfo.fromToken.symbol} → ${txInfo.toToken.symbol}`}
      icon="transaction-swap"
      type="LiFi swap"
      executionInfo={executionInfo}
      bordered={bordered}
      onPress={onPress}
      inQueue={inQueue}
      leftNode={
        <Theme name="logo">
          <View position="relative" width="$10" height="$10">
            <View position="absolute" top={0}>
              <TokenIcon
                logoUri={txInfo.fromToken.logoUri}
                accessibilityLabel={txInfo.fromToken.name}
                size="$7"
                imageBackground="$background"
              />
            </View>

            <View position="absolute" bottom={0} right={0}>
              <TokenIcon
                logoUri={txInfo.toToken.logoUri}
                accessibilityLabel={txInfo.toToken.name}
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
            +{ellipsis(toAmountFormatted, 10)} {txInfo.toToken.symbol}
          </Text>
          <Text fontSize="$3">
            −{ellipsis(fromAmountFormatted, 10)} {txInfo.fromToken.symbol}
          </Text>
        </View>
      }
    />
  )
}
