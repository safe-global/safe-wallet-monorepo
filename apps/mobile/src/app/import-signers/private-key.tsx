import React from 'react'
import { ImportPrivateKey } from '@/src/features/ImportPrivateKey'
import { View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { CaptureProtection } from 'react-native-capture-protection'

function PrivateKeyImport() {
  const insets = useSafeAreaInsets()

  // Enable capture protection when screen is focused, disable when unfocused
  useFocusEffect(
    React.useCallback(() => {
      CaptureProtection.prevent({
        screenshot: true,
        record: true,
        appSwitcher: true,
      })

      return () => {
        CaptureProtection.allow()
      }
    }, []),
  )

  return (
    <View paddingHorizontal={'$4'} flex={1} paddingBottom={insets.bottom}>
      <ImportPrivateKey />
    </View>
  )
}

export default PrivateKeyImport
