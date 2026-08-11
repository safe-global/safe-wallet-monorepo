import React from 'react'
import { Text } from 'tamagui'
import { formatPercentage } from '@safe-global/utils/utils/formatters'
import { getFiatChangeDirection } from '@safe-global/utils/utils/fiatChange'
import { getFiatChangeColor, getFiatChangeSign } from '@/src/utils/fiatChange'

interface ProtocolFiatChangeProps {
  fiatChange: number | null
}

export const ProtocolFiatChange = ({ fiatChange }: ProtocolFiatChangeProps) => {
  if (fiatChange === null) {
    return null
  }

  const direction = getFiatChangeDirection(fiatChange)

  return (
    <Text fontSize="$4" fontWeight={400} color={getFiatChangeColor(direction)} lineHeight={20}>
      {getFiatChangeSign(direction)}
      {formatPercentage(fiatChange)}
    </Text>
  )
}
