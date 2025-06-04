import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { Text, YStack, Image, styled, H2, H5 } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import TransferOldAppDark from '@/assets/images/transfer-old-app-dark.png'
import TransferOldAppLight from '@/assets/images/transfer-old-app-light.png'
import { useColorScheme } from 'react-native'
import { GradientText } from '@/src/components/GradientText'

const StyledText = styled(Text, {
  fontSize: '$4',
  textAlign: 'center',
})

export const DataTransfer = () => {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colorScheme = useColorScheme()
  const onPressTransferData = useCallback(() => {
    // Navigate to data import flow (to be implemented)
    router.navigate('/(import-accounts)')
  }, [router])

  const onPressStartFresh = useCallback(() => {
    // Go back to previous screen and then navigate to import accounts
    router.back()
    setTimeout(() => {
      router.navigate('/(import-accounts)')
    }, 100)
  }, [router])

  return (
    <YStack flex={1} paddingTop={'$4'} testID="data-transfer-screen">
      <StatusBar style="light" />

      {/* Content */}
      <YStack flex={1} paddingHorizontal="$4" justifyContent="space-between" marginBottom={'$4'}>
        <YStack gap="$4" alignItems="center">
          {colorScheme === 'dark' ? (
            <GradientText
              colors={['#5FDDFF', '#12FF80']}
              fontWeight={'600'}
              color="$green9"
              fontSize="$5"
              textAlign="center"
              gradientStart={{ x: 0, y: 0 }}
              gradientEnd={{ x: 1, y: 0 }}
            >
              Still have the old app?
            </GradientText>
          ) : (
            <H5 fontWeight={'600'} color="$colorSecondary">
              Still have the old app?
            </H5>
          )}

          <H2 fontWeight={'600'} textAlign="center">
            Transfer your data for a quick start
          </H2>

          <StyledText>
            Easily bring over your Safe accounts, signers, and address book from the old app for a smooth start, if you
            have used it before.
          </StyledText>
        </YStack>

        {/* Phone Mockup */}
        <Image source={colorScheme === 'dark' ? TransferOldAppDark : TransferOldAppLight} />
      </YStack>

      {/* Bottom Buttons */}
      <YStack gap="$3" paddingHorizontal="$4" paddingBottom={insets.bottom} paddingTop="$4">
        <SafeButton primary testID="transfer-data-button" onPress={onPressTransferData}>
          Transfer data
        </SafeButton>

        <SafeButton text testID="start-fresh-button" onPress={onPressStartFresh}>
          Start fresh
        </SafeButton>
      </YStack>
    </YStack>
  )
}
