import React from 'react'
import { View, ScrollView, Input, YStack, Theme } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { CurrencySection } from './CurrencySection'
import type { CurrencyViewProps } from './CurrencyScreen.types'

export const CurrencyView: React.FC<CurrencyViewProps> = ({
  selectedCurrency,
  cryptoCurrencies,
  fiatCurrencies,
  searchQuery,
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
            <View
              backgroundColor="rgba(118,118,128,0.12)"
              borderRadius="$3"
              paddingHorizontal="$3"
              paddingVertical="$2"
              flexDirection="row"
              alignItems="center"
            >
              <SafeFontIcon name="search" size={16} color="$colorSecondary" style={{ marginRight: 8 }} />
              <Input
                flex={1}
                placeholder="Search"
                placeholderTextColor="$colorSecondary"
                value={searchQuery}
                onChangeText={onSearchQueryChange}
                fontSize="$4"
                borderWidth={0}
                backgroundColor="transparent"
                color="$color"
              />
            </View>
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
