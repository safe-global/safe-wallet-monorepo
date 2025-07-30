import React from 'react'
import { getTokenValue, H3, ScrollView, View } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeButton } from '@/src/components/SafeButton'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { router } from 'expo-router'
import { useDispatch } from 'react-redux'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AbsoluteLinearGradient } from '@/src/components/LinearGradient'

export default function SignSuccess() {
  const dispatch = useDispatch()
  const { bottom } = useSafeAreaInsets()
  const handleDonePress = () => {
    dispatch(cgwApi.util.invalidateTags(['transactions']))

    // Go back twice to the confirm transaction screen
    router.back()
    router.back()
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
