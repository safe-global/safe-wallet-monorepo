import { ImportSuccess } from '@/src/features/ImportPrivateKey/components/ImportSuccess'
import React from 'react'
import { getTokenValue, View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AbsoluteLinearGradient } from '@/src/components/LinearGradient'

export default function ImportPrivateKeySuccess() {
  const { bottom } = useSafeAreaInsets()
  return (
    <View flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <AbsoluteLinearGradient />

      <ImportSuccess />
    </View>
  )
}
