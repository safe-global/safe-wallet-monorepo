import React from 'react'
import { Text, View } from 'tamagui'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { formatCurrency } from '@safe-global/utils/utils/formatNumber'
import { InfoSheet } from '@/src/components/InfoSheet'

interface PositionFiatChangeProps {
  fiatBalance24hChange: string | null
  fiatBalance: string
  currency: string
}

const INFO_SHEET_TITLE = '24h change'
const INFO_SHEET_DESCRIPTION =
  'This shows how much the value of this position has changed in the last 24 hours, based on token price movements.'

export const PositionFiatChange = ({ fiatBalance24hChange, fiatBalance, currency }: PositionFiatChangeProps) => {
  if (!fiatBalance24hChange) {
    return (
      <InfoSheet title={INFO_SHEET_TITLE} info={INFO_SHEET_DESCRIPTION}>
        <Text fontSize="$3" color="$colorSecondary" opacity={0.7}>
          0%
        </Text>
      </InfoSheet>
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
    <InfoSheet title={INFO_SHEET_TITLE} info={INFO_SHEET_DESCRIPTION}>
      <View flexDirection="row" alignItems="center" gap="$1">
        <Text fontSize="$3" color={getColor()} fontWeight={400}>
          {changeSign()}
          {changeLabel} ({formattedChangeAmount})
        </Text>
      </View>
    </InfoSheet>
  )
}
