import React from 'react'
import { ScrollView, YStack, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CurrencySection } from './CurrencySection'
import { NavBarTitle } from '@/src/components/Title/NavBarTitle'
import { LargeHeaderTitle } from '@/src/components/Title/LargeHeaderTitle'
import { useScrollableHeader } from '@/src/navigation/useScrollableHeader'
import SafeSearchBar from '@/src/components/SafeSearchBar/SafeSearchBar'
import type { CurrencyViewProps } from './Currency.types'
import { useColorScheme } from 'react-native'

export const CurrencyView: React.FC<CurrencyViewProps> = ({
  selectedCurrency,
  cryptoCurrencies,
  fiatCurrencies,
  onCurrencySelect,
  onSearchQueryChange,
}) => {
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const { handleScroll } = useScrollableHeader({
    children: <NavBarTitle>Currency</NavBarTitle>,
  })

  const LargeHeader = (
    <View paddingTop={'$3'} paddingHorizontal={'$4'}>
      <LargeHeaderTitle>Currency</LargeHeaderTitle>
    </View>
  )

  const SearchBarComponent = (
    <View paddingHorizontal={'$4'} paddingVertical={'$2'} backgroundColor={isDark ? '$background' : '$backgroundPaper'}>
      <SafeSearchBar placeholder="Search" onSearch={onSearchQueryChange} />
    </View>
  )

  return (
    <View flex={1}>
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        stickyHeaderIndices={[1]}
      >
        {LargeHeader}
        {SearchBarComponent}

        <YStack paddingHorizontal="$4" paddingTop="$2">
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
  )
}
