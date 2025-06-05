import React from 'react'
import { Text, YStack, H2, ScrollView, View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { StyleSheet } from 'react-native'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { LinearGradient } from 'expo-linear-gradient'

interface ImportSuccessScreenViewProps {
  bottomInset: number
  gradientColors: [string, string]
  onContinue: () => void
}

export const ImportSuccessScreenView = ({ bottomInset, gradientColors, onContinue }: ImportSuccessScreenViewProps) => {
  return (
    <View flex={1} paddingBottom={bottomInset} testID="import-success-screen">
      <LinearGradient colors={gradientColors} style={styles.background} />
      <View flex={1} justifyContent="space-between">
        <View flex={1}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$3">
              <Badge
                themeName="badge_success_variant1"
                circleSize={64}
                content={<SafeFontIcon size={32} name="check-filled" />}
              />

              <YStack margin="$4" width="100%" alignItems="center" gap="$4">
                {/* Title */}
                <H2 fontWeight={'600'} textAlign="center">
                  Import complete!
                </H2>

                {/* Subtitle */}
                <Text fontSize="$4" textAlign="center" marginHorizontal={'$4'} color="$colorSecondary">
                  Your accounts, signers and address book contacts are now ready to use with better signing experience!
                </Text>
              </YStack>
            </View>
          </ScrollView>
        </View>

        <View paddingHorizontal="$4">
          <SafeButton primary testID="continue-button" onPress={onContinue}>
            Continue
          </SafeButton>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300,
  },
})
