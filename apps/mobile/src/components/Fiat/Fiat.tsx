import { formatFiatAmount } from '@/src/utils/formatters'
import React from 'react'
import { H1, H3, View } from 'tamagui'

interface FiatProps {
  baseAmount: string
}

export const Fiat = ({ baseAmount }: FiatProps) => {
  const formattedAmount = formatFiatAmount(baseAmount)
  const [integerPart, decimalPart] = formattedAmount.split('.')

  return (
    <View flexDirection="row" alignItems="center">
      <H3 fontWeight="600">$</H3>

      {formattedAmount.includes('k') ? (
        <H1 fontWeight="600">{formattedAmount}</H1>
      ) : (
        <H1 fontWeight="600">
          {integerPart}
          {decimalPart && (
            <H1 fontWeight={600} color="$textSecondaryDark">
              .{decimalPart}
            </H1>
          )}
        </H1>
      )}
    </View>
  )
}
