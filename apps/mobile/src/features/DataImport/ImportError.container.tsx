import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from 'tamagui'
import { router } from 'expo-router'
import { ImportErrorView } from './components/ImportErrorView'

export default function ImportError() {
  const theme = useTheme()
  const colors: [string, string] = [theme.errorDark.get(), 'transparent']
  const insets = useSafeAreaInsets()

  return <ImportErrorView colors={colors} bottomInset={insets.bottom} onTryAgain={router.back} />
}
