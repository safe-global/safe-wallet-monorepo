import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, Text, useTheme, View } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { LargeHeaderTitle } from '@/src/components/Title'
import { SafeButton } from '@/src/components/SafeButton'
import { router } from 'expo-router'

export default function SignError({ onRetryPress, description }: { onRetryPress: () => void; description?: string }) {
  const theme = useTheme()
  const colors: [string, string] = [theme.errorDark.get(), 'transparent']

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
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
                  Couldn’t execute the transaction
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
    </SafeAreaView>
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
