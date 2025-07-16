import React from 'react'
import { Text, YStack, Image, styled, H2 } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import ImportDataSelectFilesDark from '@/assets/images/import-data-select-files-dark.png'
import ImportDataSelectFilesLight from '@/assets/images/import-data-select-files-light.png'
import { ColorSchemeName, TouchableOpacity } from 'react-native'

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

interface FileSelectionViewProps {
  colorScheme: ColorSchemeName
  bottomInset: number
  onFileSelect: () => void
  onImagePress: () => void
}

export const FileSelectionView = ({ colorScheme, bottomInset, onFileSelect, onImagePress }: FileSelectionViewProps) => {
  return (
    <YStack flex={1} testID="file-selection-screen" paddingBottom={bottomInset}>
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
            <TouchableOpacity onPress={onImagePress} activeOpacity={0.8}>
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
          <SafeButton primary testID="select-file-to-import-button" onPress={onFileSelect}>
            Select file to import
          </SafeButton>
        </YStack>
      </YStack>
    </YStack>
  )
}
