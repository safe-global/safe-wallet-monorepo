import React from 'react'
import { View, Text, YStack } from 'tamagui'
import { CurrencyItem } from '../CurrencyItem'
import { CURRENCY_DATA } from '@/src/config/currencies'
import type { CurrencySectionProps } from '../CurrencyScreen.types'

export const CurrencySection: React.FC<CurrencySectionProps> = ({
  title,
  currencies,
  selectedCurrency,
  onCurrencySelect,
}) => (
  <YStack space="$2">
    <View paddingHorizontal="$4" paddingVertical="$2">
      <Text fontSize="$4" fontWeight="500" color="$colorSecondary">
        {title}
      </Text>
    </View>
    {currencies.map((currency) => {
      const currencyInfo = CURRENCY_DATA[currency.toUpperCase()]
      if (!currencyInfo) {
        return null
      }

      return (
        <CurrencyItem
          key={currency}
          code={currency.toUpperCase()}
          symbol={currencyInfo.symbol}
          name={currencyInfo.name}
          isSelected={selectedCurrency.toUpperCase() === currency.toUpperCase()}
          onPress={() => onCurrencySelect(currency.toLowerCase())}
        />
      )
    })}
  </YStack>
)
