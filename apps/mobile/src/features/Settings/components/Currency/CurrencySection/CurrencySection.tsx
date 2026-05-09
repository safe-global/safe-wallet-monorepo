import React from 'react'
import { View, Text, YStack } from 'tamagui'
import { CurrencyItem } from '../CurrencyItem'
import { getCurrencyName, getCurrencySymbol } from '@/src/utils/currency'
import type { CurrencySectionProps } from '../Currency.types'

export const CurrencySection: React.FC<CurrencySectionProps> = ({
  title,
  currencies,
  selectedCurrency,
  onCurrencySelect,
}) => (
  <YStack marginBottom="$4">
    <View paddingVertical="$2">
      <Text fontSize="$4" fontWeight="500" color="$colorSecondary">
        {title}
      </Text>
    </View>
    <YStack gap="$4">
      {currencies.map((currency) => {
        const currencyName = getCurrencyName(currency)
        const currencySymbol = getCurrencySymbol(currency)
        if (!currencyName || !currencySymbol) {
          return null
        }

        return (
          <CurrencyItem
            key={currency}
            code={currency.toUpperCase()}
            symbol={currencySymbol}
            name={currencyName}
            isSelected={selectedCurrency.toUpperCase() === currency.toUpperCase()}
            onPress={() => onCurrencySelect(currency.toLowerCase())}
          />
        )
      })}
    </YStack>
  </YStack>
)
