import React from 'react'
import { View, ScrollView, YStack, Theme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SafeSearchBar from '@/src/components/SafeSearchBar/SafeSearchBar'
import { CurrencySection } from './CurrencySection'
import type { CurrencyViewProps } from './Currency.types'

export const CurrencyView: React.FC<CurrencyViewProps> = ({
  selectedCurrency,
  cryptoCurrencies,
  fiatCurrencies,
  onSearchQueryChange,
  onCurrencySelect,
}) => {
  const insets = useSafeAreaInsets()

  return (
    <Theme name="dark">
      <View flex={1} backgroundColor="$background">
        {/* Header */}
        <View backgroundColor="$background" paddingTop="$4">
          {/* Search Bar */}
          <View paddingHorizontal="$4" paddingBottom="$4">
            <SafeSearchBar placeholder="Search" onSearch={onSearchQueryChange} />
          </View>
        </View>

        {/* Content */}
        <ScrollView
          flex={1}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        >
          <YStack space="$4">
            {cryptoCurrencies.length > 0 && (
              <CurrencySection
                title="Crypto"
                currencies={cryptoCurrencies}
                selectedCurrency={selectedCurrency}
                onCurrencySelect={onCurrencySelect}
              />
            )}

            {fiatCurrencies.length > 0 && (
              <CurrencySection
                title="Fiat"
                currencies={fiatCurrencies}
                selectedCurrency={selectedCurrency}
                onCurrencySelect={onCurrencySelect}
              />
            )}
          </YStack>
        </ScrollView>
      </View>
    </Theme>
  )
}
