import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColorScheme } from 'react-native'
import { useDataImportContext } from './context/DataImportProvider'
import { FileSelectionView } from './components/FileSelectionView'

export const FileSelection = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const { pickFile } = useDataImportContext()

  const handleFileSelect = useCallback(async () => {
    const fileSelected = await pickFile()
    // Only navigate if a file was actually selected
    if (fileSelected) {
      router.push('/import-data/enter-password')
    }
  }, [pickFile, router])

  const handleImagePress = useCallback(() => {
    handleFileSelect()
  }, [handleFileSelect])

  return (
    <FileSelectionView
      colorScheme={colorScheme}
      bottomInset={insets.bottom}
      onFileSelect={handleFileSelect}
      onImagePress={handleImagePress}
    />
  )
}
