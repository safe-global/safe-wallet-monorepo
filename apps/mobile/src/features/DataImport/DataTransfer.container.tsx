import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColorScheme } from 'react-native'
import { DataTransferView } from './components/DataTransferView'

export const DataTransfer = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()

  const onPressTransferData = useCallback(() => {
    // Navigate to help import flow
    router.navigate('/import-data/help-import')
  }, [router])

  const onPressStartFresh = useCallback(() => {
    // Go back to previous screen and then navigate to import accounts
    router.back()
    setTimeout(() => {
      router.navigate('/(import-accounts)')
    }, 100)
  }, [router])

  return (
    <DataTransferView
      colorScheme={colorScheme}
      bottomInset={insets.bottom}
      onPressTransferData={onPressTransferData}
      onPressStartFresh={onPressStartFresh}
    />
  )
}
