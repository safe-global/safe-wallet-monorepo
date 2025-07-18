import React from 'react'
import { Text, YStack, XStack, styled, H2 } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { TouchableOpacity } from 'react-native'
import { Badge } from '@/src/components/Badge'

const StepText = styled(Text, {
  fontSize: '$4',
  lineHeight: '$5',
  color: '$color',
  flex: 1,
})

const HighlightedText = styled(Text, {
  color: '$primary',
  fontWeight: '600',
})

const StepBadge = ({ step }: { step: string }) => {
  return <Badge themeName="badge_background" content={step} textContentProps={{ fontWeight: 600 }} />
}

interface HelpImportViewProps {
  bottomInset: number
  onPressProceedToImport: () => void
  onPressNeedHelp: () => void
}

export const HelpImportView = ({ bottomInset, onPressProceedToImport, onPressNeedHelp }: HelpImportViewProps) => {
  return (
    <YStack flex={1} testID="help-import-screen">
      <YStack flex={1} paddingHorizontal="$4" justifyContent="space-between" marginTop={'$4'}>
        <YStack gap="$6">
          <H2 fontWeight={'600'} textAlign="center" marginHorizontal={'$4'}>
            How to move your data
          </H2>

          <YStack gap="$4">
            <XStack gap="$3" alignItems="center">
              <StepBadge step="1" />
              <StepText>
                Open your old Safe{'{'}Wallet{'}'} app.
              </StepText>
            </XStack>

            <XStack gap="$3" alignItems="center">
              <StepBadge step="2" />
              <StepText>
                Go to <HighlightedText>Settings</HighlightedText> → <HighlightedText>Export Data</HighlightedText>.
              </StepText>
            </XStack>

            <XStack gap="$3" alignItems="center">
              <StepBadge step="3" />
              <StepText>Follow the steps to save the file.</StepText>
            </XStack>

            <XStack gap="$3" alignItems="center">
              <StepBadge step="4" />
              <StepText>Return here to import it.</StepText>
            </XStack>
          </YStack>
        </YStack>

        <YStack gap="$4" paddingBottom={bottomInset}>
          <SafeButton primary testID="proceed-to-import-button" onPress={onPressProceedToImport}>
            Proceed to import
          </SafeButton>

          <TouchableOpacity onPress={onPressNeedHelp} testID="need-help-button">
            <Text textAlign="center" fontSize="$4">
              Need help? <HighlightedText>Visit Help Center</HighlightedText>
            </Text>
          </TouchableOpacity>
        </YStack>
      </YStack>
    </YStack>
  )
}
