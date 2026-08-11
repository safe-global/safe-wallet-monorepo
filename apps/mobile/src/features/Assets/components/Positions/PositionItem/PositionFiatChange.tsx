import React from 'react'
import { Text, View } from 'tamagui'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import { getFiatChangeDirection, parseFiatChange } from '@safe-global/utils/utils/fiatChange'
import { getFiatChangeColor, getFiatChangeSign } from '@/src/utils/fiatChange'
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
  const changeAsNumber = parseFiatChange(fiatBalance24hChange)

  if (changeAsNumber === null) {
    return (
      <InfoSheet title={INFO_SHEET_TITLE} info={INFO_SHEET_DESCRIPTION}>
        <Text fontSize="$3" color="$colorSecondary" opacity={0.7}>
          0%
        </Text>
      </InfoSheet>
    )
  }

  const direction = getFiatChangeDirection(changeAsNumber)
  const changeAmount = Number(fiatBalance) * changeAsNumber
  const formattedChangeAmount = formatCurrencyPrecise(Math.abs(changeAmount).toString(), currency)

  return (
    <InfoSheet title={INFO_SHEET_TITLE} info={INFO_SHEET_DESCRIPTION}>
      <View flexDirection="row" alignItems="center" gap="$1">
        <Text fontSize="$3" color={getFiatChangeColor(direction)} fontWeight={400}>
          {getFiatChangeSign(direction)}
          {formatPercentage(changeAsNumber)} ({formattedChangeAmount})
        </Text>
      </View>
    </InfoSheet>
  )
}
