import React from 'react'
import { NameSignerContainer } from '@/src/features/ImportSigner/components/NameSigner'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function NameSigner() {
  const { bottom } = useSafeAreaInsets()

  return (
    <View paddingHorizontal="$4" flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <NameSignerContainer />
    </View>
  )
}

export default NameSigner
