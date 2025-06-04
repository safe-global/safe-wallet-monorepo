import React from 'react'
import { useRouter } from 'expo-router'
import { Text, YStack, H2, ScrollView, H3, useTheme, View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { useColorScheme, StyleSheet } from 'react-native'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectAllSafes, SafesSlice } from '@/src/store/safesSlice'
import { setActiveSafe } from '@/src/store/activeSafeSlice'
import { SafeInfo } from '@/src/types/address'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'

export const ImportSuccessScreen = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const dispatch = useAppDispatch()
  const allSafes = useAppSelector(selectAllSafes) as SafesSlice
  const theme = useTheme()
  const colors: [string, string] = [theme.success.get(), 'transparent']

  const handleContinue = () => {
    // Find the first imported safe and set it as active
    const safeAddresses = Object.keys(allSafes)

    if (safeAddresses.length > 0) {
      const firstSafeAddress = safeAddresses[0] as `0x${string}`
      const firstSafe = allSafes[firstSafeAddress]
      const chainIds = Object.keys(firstSafe)

      if (chainIds.length > 0) {
        const activeChainId = chainIds[0]
        const activeSafeInfo: SafeInfo = {
          address: firstSafeAddress,
          chainId: activeChainId,
        }

        dispatch(setActiveSafe(activeSafeInfo))

        // Navigates to first screen in stack
        router.dismissAll()
        // closes first screen in stack
        router.back()
        // Navigate to the main assets screen
        router.replace('/(tabs)')
        return
      }
    }

    // Fallback: just navigate to main screen
    router.replace('/(tabs)')
  }

  return (
    <View flex={1} paddingBottom={insets.bottom} testID="import-success-screen">
      <LinearGradient colors={colors} style={styles.background} />
      <View flex={1} justifyContent="space-between">
        <View flex={1}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View flex={1} flexGrow={1} alignItems="center" justifyContent="center" paddingHorizontal="$3">
              <Badge
                // circleProps={{ backgroundColor: '#1B2A22' }}
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
          <SafeButton primary testID="continue-button" onPress={handleContinue}>
            Continue
          </SafeButton>
        </View>
      </View>
    </View>
  )

  return (
    <ScrollView contentContainerStyle={{ flex: 1 }}>
      <YStack flex={1} testID="import-success-screen">
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

        {/* Content */}
        <YStack flex={1} paddingHorizontal="$4" justifyContent="space-between" marginTop={'$4'}>
          <YStack gap="$6" alignItems="center" justifyContent="center" flex={1}>
            {/* Success Icon */}
            <YStack marginBottom="$4">
              <Badge
                themeName="badge_success"
                circleSize={64}
                content={<SafeFontIcon name="check" size={32} color="white" />}
              />
            </YStack>

            {/* Title */}
            <H2 fontWeight={'600'} textAlign="center">
              Import complete!
            </H2>

            {/* Subtitle */}
            <Text fontSize="$4" textAlign="center" marginHorizontal={'$4'} color="$colorSecondary">
              Your accounts, signers and address book contacts are now ready to use with better signing experience!
            </Text>
          </YStack>

          {/* Bottom section */}
          <YStack gap="$4" paddingBottom={insets.bottom}>
            {/* Continue button */}
            <SafeButton primary testID="continue-button" onPress={handleContinue}>
              Continue
            </SafeButton>
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
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
