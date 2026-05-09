import React from 'react'
import { Text, View } from 'tamagui'
import { SafeListItem } from '@/src/components/SafeListItem'
import { TokenIcon } from '@/src/components/TokenIcon'
import { formatCurrency, formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { shouldDisplayPreciseBalance } from '@/src/utils/balance'
import { getReadablePositionType } from '@safe-global/utils/features/positions'
import type { Position } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { PositionFiatChange } from './PositionFiatChange'

interface PositionItemProps {
  position: Position
  currency: string
}

export const PositionItem = ({ position, currency }: PositionItemProps) => {
  const { tokenInfo, balance, fiatBalance, position_type, fiatBalance24hChange } = position
  const positionTypeLabel = getReadablePositionType(position_type)

  const formattedBalance = `${formatVisualAmount(balance, tokenInfo.decimals)} ${tokenInfo.symbol}`
  const formattedFiatBalance = shouldDisplayPreciseBalance(fiatBalance, 7)
    ? formatCurrencyPrecise(fiatBalance, currency)
    : formatCurrency(fiatBalance, currency)

  return (
    <SafeListItem
      testID={`position-${tokenInfo.symbol}`}
      label={
        <View>
          <Text fontSize="$4" fontWeight={600} lineHeight={20}>
            {tokenInfo.name}
          </Text>
          <View flexDirection="row" alignItems="center" gap="$1">
            <Text fontSize="$3" color="$colorSecondary" fontWeight={400} lineHeight={16}>
              {formattedBalance}
            </Text>
            <Text fontSize="$3" color="$colorSecondary" fontWeight={400}>
              •
            </Text>
            <Text fontSize="$3" color="$colorSecondary" fontWeight={400}>
              {positionTypeLabel}
            </Text>
          </View>
        </View>
      }
      transparent
      leftNode={<TokenIcon logoUri={tokenInfo.logoUri} accessibilityLabel={tokenInfo.name} size="$8" />}
      rightNode={
        <View alignItems="flex-end">
          <Text fontSize="$4" fontWeight={400} color="$color" testID={`position-${tokenInfo.symbol}-fiat-balance`}>
            {formattedFiatBalance}
          </Text>
          <View marginTop="$1">
            <PositionFiatChange
              fiatBalance24hChange={fiatBalance24hChange}
              fiatBalance={fiatBalance}
              currency={currency}
            />
          </View>
        </View>
      }
      paddingVertical="$2"
      spaced={false}
    />
  )
}
