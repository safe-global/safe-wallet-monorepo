import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, Text, View } from 'tamagui'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { LargeHeaderTitle } from '@/src/components/Title'
import { SafeButton } from '@/src/components/SafeButton'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import { router } from 'expo-router'
import { useDispatch } from 'react-redux'

const colors: [string, string] = ['#0b301c', 'transparent']

export default function SignSuccess() {
  const dispatch = useDispatch()

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

              <View margin="$4" width="100%" alignItems="center" gap="$4">
                <LargeHeaderTitle textAlign="center">Transaction confirmed!</LargeHeaderTitle>

                <Text textAlign="center" fontSize="$4" width="80%">
                  You have successfully signed this transaction.
                </Text>
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
