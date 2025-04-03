import React, { useMemo } from 'react'
import { H1, H2, View, XStack } from 'tamagui'
import { formatCurrency, formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'

interface FiatProps {
  value: string
  currency: string
  maxLength?: number
  precise?: boolean
}

export const Fiat = ({ value, currency, maxLength, precise }: FiatProps) => {
  const fiat = useMemo(() => {
    return formatCurrency(value, currency, maxLength)
  }, [value, currency, maxLength])

  const preciseFiat = useMemo(() => {
    return formatCurrencyPrecise(value, currency)
  }, [value, currency])

  const [symbol, whole, decimals, endCurrency] = useMemo(() => {
    const match = (preciseFiat ?? '').match(/(\D+)?(.+)(\D\d+)(\D+)?$/)
    return match ? match.slice(1) : ['', '', preciseFiat, '', '']
  }, [preciseFiat])

  return (
    <View flexDirection="row" alignItems="center" testID={'fiat-balance-display'}>
      {precise ? (
        <XStack>
          <H2 fontWeight={'600'} alignSelf={'flex-end'} marginBottom={'$2'} fontSize={27}>
            {symbol}
          </H2>
          <H1 fontWeight="600">{whole}</H1>
          {decimals && (
            <H1 fontWeight={600} color="$textSecondaryDark">
              {decimals}
            </H1>
          )}
          <H1 fontWeight={600}>{endCurrency}</H1>
        </XStack>
      ) : (
        <H1 fontWeight="600">{fiat}</H1>
      )}
    </View>
  )
}
