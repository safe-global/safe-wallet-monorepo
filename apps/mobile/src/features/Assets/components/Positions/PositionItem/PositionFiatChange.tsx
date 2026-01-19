import React from 'react'
import { Text, View } from 'tamagui'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'

interface PositionFiatChangeProps {
  fiatBalance24hChange: string | null
  fiatBalance: string
  currency: string
}

export const PositionFiatChange = ({ fiatBalance24hChange, fiatBalance, currency }: PositionFiatChangeProps) => {
  if (!fiatBalance24hChange) {
    return (
      <Text fontSize="$3" color="$colorSecondary" opacity={0.7}>
        0%
      </Text>
    )
  }

  const changeAsNumber = Number(fiatBalance24hChange) / 100
  const changeLabel = formatPercentage(changeAsNumber)
  const direction = changeAsNumber < 0 ? 'down' : changeAsNumber > 0 ? 'up' : 'none'

  const fiatBalanceNumber = Number(fiatBalance)
  const changeAmount = fiatBalanceNumber * changeAsNumber
  const formattedChangeAmount = formatCurrency(Math.abs(changeAmount).toString(), currency)

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
      <Text fontSize="$3" color={getColor()} fontWeight={400}>
        {changeSign()}
        {changeLabel} ({formattedChangeAmount})
      </Text>
    </View>
  )
}
