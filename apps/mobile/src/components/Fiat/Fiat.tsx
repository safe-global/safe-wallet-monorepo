import React, { useMemo } from 'react'
import { H1, View } from 'tamagui'
import { formatCurrency, formatCurrencyPrecise } from '@safe-global/utils/formatNumber'

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

  const [whole, decimals, endCurrency] = useMemo(() => {
    const match = (preciseFiat ?? '').match(/(.+)(\D\d+)(\D+)?$/)
    return match ? match.slice(1) : ['', preciseFiat, '', '']
  }, [preciseFiat])

  if (fiat == null) {
    return <H1 fontWeight="600">--</H1>
  }

  return (
    <View flexDirection="row" alignItems="center" testID={'fiat-balance-display'}>
      {precise ? (
        <H1 fontWeight="600">
          {whole}
          {decimals && (
            <H1 fontWeight={600} color="$textSecondaryDark">
              {decimals}
            </H1>
          )}
          {endCurrency}
        </H1>
      ) : (
        <H1 fontWeight="600">{fiat}</H1>
      )}
    </View>
  )
}
