import React from 'react'
import { getTokenValue, H2, ScrollView, Text, View } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeButton } from '@/src/components/SafeButton'

import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AbsoluteLinearGradient } from '@/src/components/LinearGradient'
import { useTheme } from '@/src/theme/hooks/useTheme'

export function ExecuteProcessing({ txId }: { txId: string }) {
  const { bottom } = useSafeAreaInsets()
  const { isDark } = useTheme()

  const color = isDark ? getTokenValue('$color.backgroundLightDark') : getTokenValue('$color.backgroundLightLight')

  const handleTxPress = () => {
    router.navigate({
      pathname: '/confirm-transaction',
      params: {
        txId,
      },
    })
  }

  const handleHomePress = () => {
    router.dismissAll()
  }

  return (
    <View style={{ flex: 1 }} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <AbsoluteLinearGradient />
      <View flex={1} justifyContent="space-between">
        <View flex={1}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$3">
              <Badge
                circleProps={{ backgroundColor: color }}
                themeName="badge_success"
                circleSize={64}
                content={<SafeFontIcon size={32} color="$primary" name="check-filled" />}
              />

              <View margin="$4" width="100%" alignItems="center" gap="$4" padding="$4">
                <H2 textAlign="center" fontWeight={'600'} lineHeight={32}>
                  We are processing your transaction
                </H2>

                <Text>It can take up to 30 seconds to process.</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        <View paddingHorizontal="$4" gap="$2">
          <SafeButton onPress={handleTxPress}>View transaction</SafeButton>
          <SafeButton text onPress={handleHomePress}>
            Back to Home
          </SafeButton>
        </View>
      </View>
    </View>
  )
}
