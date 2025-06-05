import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { ScrollView, Text, View, YStack } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { LargeHeaderTitle } from '@/src/components/Title'
import { SafeButton } from '@/src/components/SafeButton'

interface ImportErrorViewProps {
  colors: [string, string]
  bottomInset: number
  onTryAgain: () => void
}

export const ImportErrorView = ({ colors, bottomInset, onTryAgain }: ImportErrorViewProps) => {
  return (
    <YStack flex={1} testID="import-error-screen" paddingBottom={bottomInset}>
      <LinearGradient colors={colors} style={styles.background} />
      <View flex={1} justifyContent="space-between">
        <View flex={1}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View
              flex={1}
              flexGrow={1}
              alignItems="center"
              marginTop="$10"
              justifyContent="center"
              paddingHorizontal="$3"
            >
              <Badge
                themeName="badge_error"
                circleSize={64}
                content={<SafeFontIcon size={32} color="$error" name="close-filled" />}
              />

              <View margin="$4" width="100%" alignItems="center" gap="$4">
                <LargeHeaderTitle textAlign="center" size="$8" lineHeight={32} maxWidth={200} fontWeight={600}>
                  Import failed
                </LargeHeaderTitle>

                <Text textAlign="center" fontSize="$4" width="80%">
                  {'The file could not be processed. Ensure the data meets the required specifications.'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>

        <View paddingHorizontal="$4" gap="$4">
          <SafeButton onPress={onTryAgain}>Try again</SafeButton>
        </View>
      </View>
    </YStack>
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
