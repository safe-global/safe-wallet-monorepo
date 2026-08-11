import React from 'react'
import { Text, View } from 'tamagui'
import { type Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { getFiatChangeDirection, parseFiatChange } from '@safe-global/utils/utils/fiatChange'
import { getFiatChangeColor, getFiatChangeSign } from '@/src/utils/fiatChange'

interface FiatChangeProps {
  balanceItem: Balance
}

export const FiatChange = ({ balanceItem }: FiatChangeProps) => {
  const changeAsNumber = parseFiatChange(balanceItem.fiatBalance24hChange)

  if (changeAsNumber === null) {
    return (
      <Text fontSize="$3" color="$colorSecondary" opacity={0.7}>
        0%
      </Text>
    )
  }

  const direction = getFiatChangeDirection(changeAsNumber)

  return (
    <View flexDirection="row" alignItems="center" gap="$1">
      <Text fontSize="$3" color={getFiatChangeColor(direction)} fontWeight="500">
        {getFiatChangeSign(direction)}
        {formatPercentage(changeAsNumber)}
      </Text>
    </View>
  )
}
