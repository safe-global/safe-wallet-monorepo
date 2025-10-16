import React from 'react'
import { Text, View } from 'tamagui'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { formatPercentage } from '@safe-global/utils/utils/formatters'

interface FiatChangeProps {
  balanceItem: Balance
}

export const FiatChange = ({ balanceItem }: FiatChangeProps) => {
  if (!balanceItem.fiatBalance24hChange) {
    return (
      <Text fontSize="$3" color="$colorSecondary" opacity={0.7}>
        0%
      </Text>
    )
  }

  const changeAsNumber = Number(balanceItem.fiatBalance24hChange) / 100
  const changeLabel = formatPercentage(changeAsNumber)
  const direction = changeAsNumber < 0 ? 'down' : changeAsNumber > 0 ? 'up' : 'none'

  const getColor = () => {
    switch (direction) {
      case 'down':
        return '$error'
      case 'up':
        return '$success'
      default:
        return '$colorSecondary'
    }
  }

  const changeSign = () => {
    switch (direction) {
      case 'down':
        return '-'
      case 'up':
        return '+'
      default:
        return ''
    }
  }

  return (
    <View flexDirection="row" alignItems="center" gap="$1">
      <Text fontSize="$3" color={getColor()} fontWeight="500">
        {changeSign()}
        {changeLabel}
      </Text>
    </View>
  )
}
