import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColorScheme, Linking } from 'react-native'
import { HELP_CENTER_URL } from '@safe-global/utils/config/constants'
import { HelpImportView } from './components/HelpImportView'

export const HelpImport = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()

  const onPressProceedToImport = useCallback(() => {
    // Navigate to file selection screen
    router.push('/import-data/file-selection')
  }, [router])

  const onPressNeedHelp = useCallback(() => {
    Linking.openURL(HELP_CENTER_URL)
  }, [])

  return (
    <HelpImportView
      colorScheme={colorScheme}
      bottomInset={insets.bottom}
      onPressProceedToImport={onPressProceedToImport}
      onPressNeedHelp={onPressNeedHelp}
    />
  )
}
