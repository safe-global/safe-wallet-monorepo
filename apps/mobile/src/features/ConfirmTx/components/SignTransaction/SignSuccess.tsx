import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { H3, ScrollView, useTheme, View } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { SafeButton } from '@/src/components/SafeButton'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { router } from 'expo-router'
import { useDispatch } from 'react-redux'

export default function SignSuccess() {
  const dispatch = useDispatch()
  const theme = useTheme()
  const colors: [string, string] = [theme.success.get(), 'transparent']

  const handleDonePress = () => {
    dispatch(cgwApi.util.invalidateTags(['transactions']))

    router.back()
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <LinearGradient colors={colors} style={styles.background} />
      <View flex={1} justifyContent="space-between">
        <View flex={1}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$3">
              <Badge
                circleProps={{ backgroundColor: '#1B2A22' }}
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
