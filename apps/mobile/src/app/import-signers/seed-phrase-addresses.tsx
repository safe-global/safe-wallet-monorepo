import React from 'react'
import { SeedPhraseAddressesContainer } from '@/src/features/ImportSigner/SeedPhraseAddresses.container'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function SeedPhraseAddresses() {
  const { bottom } = useSafeAreaInsets()

  return (
    <View paddingHorizontal={'$4'} flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <SeedPhraseAddressesContainer />
    </View>
  )
}

export default SeedPhraseAddresses
