import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getTokenValue, ScrollView, Text, useTheme, View } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { LargeHeaderTitle } from '@/src/components/Title'
import { SafeButton } from '@/src/components/SafeButton'
import { router } from 'expo-router'
import { AbsoluteLinearGradient } from '@/src/components/LinearGradient'

export default function SignError({ onRetryPress, description }: { onRetryPress: () => void; description?: string }) {
  const theme = useTheme()
  const colors: [string, string] = [theme.errorDark.get(), 'transparent']
  const { bottom } = useSafeAreaInsets()
  return (
    <View flex={1} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <AbsoluteLinearGradient colors={colors} style={{ opacity: 1 }} />
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
                  Couldn't sign the transaction
                </LargeHeaderTitle>

                <Text textAlign="center" fontSize="$4" width="80%">
                  {description || 'There was an error executing this transaction.'}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>

        <View paddingHorizontal="$4" gap="$4">
          <SafeButton onPress={onRetryPress}>Retry</SafeButton>
          <SafeButton text onPress={router.back}>
            View transaction
          </SafeButton>
        </View>
      </View>
    </View>
  )
}
