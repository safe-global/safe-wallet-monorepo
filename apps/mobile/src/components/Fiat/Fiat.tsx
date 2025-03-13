import React, { useMemo } from 'react'
import { H1, H3, View } from 'tamagui'
import { customIntl, parseFormattedNumber } from '@/src/utils/formatters'

interface FiatProps {
  value: string
  currency: string
}

export const Fiat = ({ value, currency }: FiatProps) => {
  const numericValue = parseFloat(value.replace(/,/g, ''))

  const fiat = useMemo(() => {
    return customIntl(numericValue, 'en-US', currency)
  }, [numericValue, currency])

  const { symbol, integerPart, decimalPart, suffix } = useMemo(() => {
    return parseFormattedNumber(fiat)
  }, [fiat])

  return (
    <View flexDirection="row" alignItems="center">
      <H3 fontWeight="600">{symbol}</H3>
      <H1 fontWeight="600">
        {integerPart}
        {decimalPart && (
          <H1 fontWeight={600} color="$textSecondaryDark">
            .{decimalPart}
          </H1>
        )}
        {suffix}
      </H1>
    </View>
  )
}
