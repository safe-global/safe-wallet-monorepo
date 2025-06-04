import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { Text, YStack, Image, styled, H2 } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import ImportDataSelectFilesDark from '@/assets/images/import-data-select-files-dark.png'
import ImportDataSelectFilesLight from '@/assets/images/import-data-select-files-light.png'
import { useColorScheme, TouchableOpacity } from 'react-native'
import { useDataImportContext } from './DataImportProvider'

const StyledText = styled(Text, {
  fontSize: '$4',
  textAlign: 'center',
  color: '$colorSecondary',
})

const PrivacyText = styled(Text, {
  fontSize: '$3',
  textAlign: 'center',
  color: '$colorSecondary',
  paddingHorizontal: '$4',
})

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
    <YStack flex={1} testID="file-selection-screen" paddingBottom={insets.bottom}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

      {/* Content */}
      <YStack flex={1} paddingHorizontal="$4" justifyContent="space-between" marginTop={'$4'}>
        <YStack gap="$4" flex={1}>
          {/* Title */}
          <H2 fontWeight={'600'} textAlign="center" marginHorizontal={'$4'}>
            Almost there! Import file to the new app
          </H2>

          {/* Subtitle */}
          <StyledText>Locate the exported file from the old app to continue.</StyledText>

          {/* Image - Tappable */}
          <YStack flex={1} justifyContent="center" alignItems="center">
            <TouchableOpacity onPress={handleImagePress} activeOpacity={0.8}>
              <Image
                source={colorScheme === 'dark' ? ImportDataSelectFilesDark : ImportDataSelectFilesLight}
                alignSelf="center"
                marginVertical="$4"
              />
            </TouchableOpacity>
          </YStack>
        </YStack>

        {/* Bottom Actions */}
        <YStack gap="$4">
          <PrivacyText>Don't worry, all your data will stay private and secure during the transfer.</PrivacyText>
          <SafeButton primary testID="select-file-to-import-button" onPress={handleFileSelect}>
            Select file to import
          </SafeButton>
        </YStack>
      </YStack>
    </YStack>
  )
}
