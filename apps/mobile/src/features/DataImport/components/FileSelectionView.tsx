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

interface FileSelectionViewProps {
  colorScheme: ColorSchemeName
  bottomInset: number
  onFileSelect: () => void
  onImagePress: () => void
}

export const FileSelectionView = ({ colorScheme, bottomInset, onFileSelect, onImagePress }: FileSelectionViewProps) => {
  return (
    <YStack flex={1} testID="file-selection-screen" paddingBottom={bottomInset}>
      <YStack flex={1} paddingHorizontal="$4" justifyContent="space-between" marginTop={'$4'}>
        <YStack gap="$4" flex={1}>
          <H2 fontWeight={'600'} textAlign="center" marginHorizontal={'$4'}>
            Import your file
          </H2>

          <StyledText>Find the exported file from your old app to continue.</StyledText>

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

        <YStack gap="$4">
          <SafeButton primary testID="select-file-to-import-button" onPress={onFileSelect}>
            Select from files
          </SafeButton>
        </YStack>
      </YStack>
    </YStack>
  )
}
