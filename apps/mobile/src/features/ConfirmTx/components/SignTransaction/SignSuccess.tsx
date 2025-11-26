import React from 'react'
import { getTokenValue, H3, ScrollView, View } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeButton } from '@/src/components/SafeButton'

import { router, useGlobalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AbsoluteLinearGradient } from '@/src/components/LinearGradient'

export const SignSuccess = () => {
  const { txId } = useGlobalSearchParams<{ txId: string }>()
  const { bottom } = useSafeAreaInsets()
  const handleDonePress = () => {
    router.dismissTo({
      pathname: '/confirm-transaction',
      params: {
        txId,
      },
    })
  }

  return (
    <View style={{ flex: 1 }} paddingBottom={Math.max(bottom, getTokenValue('$4'))}>
      <AbsoluteLinearGradient />
      <View flex={1} justifyContent="space-between">
        <View flex={1}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$3">
              <Badge
                circleProps={{ backgroundColor: '$backgroundLightLight' }}
                themeName="badge_success"
                circleSize={64}
                content={<SafeFontIcon size={32} color="$primary" name="check-filled" />}
              />

              <View margin="$4" width="100%" alignItems="center" gap="$4" padding="$4">
                <H3 textAlign="center" fontWeight={'600'} lineHeight={32}>
                  You successfully signed this transaction.
                </H3>
              </View>
            </View>
          </ScrollView>
        </View>

        <View paddingHorizontal="$4">
          <SafeButton onPress={handleDonePress}>Done</SafeButton>
        </View>
      </View>
    </View>
  )
}
