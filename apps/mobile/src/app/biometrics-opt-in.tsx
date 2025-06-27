import React, { useEffect, useMemo } from 'react'
import { useColorScheme, Platform } from 'react-native'
import { OptIn } from '@/src/components/OptIn'
import { router, useLocalSearchParams } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { useBiometrics } from '@/src/hooks/useBiometrics'
import Logger from '@/src/utils/logger'
import { View } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
function BiometricsOptIn() {
  const { toggleBiometrics, getBiometricsUIInfo, isBiometricsEnabled, isLoading } = useBiometrics()
  const { bottom } = useSafeAreaInsets()
  const local = useLocalSearchParams<{
    safeAddress: string
    chainId: string
    import_safe: string
    txId: string
    signerAddress: string
    caller: '/import-signers' | '/sign-transaction'
  }>()

  const redirectTo = useMemo(() => {
    if (local.caller === '/import-signers') {
      return {
        pathname: '/import-signers/private-key' as const,
        params: {
          safeAddress: local.safeAddress,
          chainId: local.chainId,
          import_safe: local.import_safe,
        },
      }
    }
    return {
      pathname: '/sign-transaction' as const,
      params: {
        txId: local.txId,
        signerAddress: local.signerAddress,
      },
    }
  }, [local.caller])

  const colorScheme = useColorScheme()
  const toast = useToastController()

  useEffect(() => {
    if (isBiometricsEnabled) {
      router.dismiss()
      router.push(redirectTo)
    }
  }, [isBiometricsEnabled])

  const handleReject = () => {
    router.back()
  }

  const handleAccept = async () => {
    try {
      await toggleBiometrics(true)
    } catch (error) {
      Logger.error('Error enabling biometrics', error)
      toast.show('Error enabling biometrics', {
        native: false,
        duration: 2000,
      })
    }
  }

  const darkImage =
    Platform.OS === 'ios'
      ? require('@/assets/images/biometrics-dark.png')
      : require('@/assets/images/biometrics-dark-android.png')

  const lightImage =
    Platform.OS === 'ios'
      ? require('@/assets/images/biometrics-light.png')
      : require('@/assets/images/biometrics-light-android.png')

  const image = colorScheme === 'dark' ? darkImage : lightImage

  const infoMessage = 'Biometrics is required to import a signer.'

  return (
    <View style={{ flex: 1, paddingBottom: bottom }}>
      <OptIn
        testID="biometrics-opt-in-screen"
        title="Simplify access, enhance security"
        description="Enable biometrics to unlock the app quickly and confirm transactions securely using your device's biometric authentication."
        image={image}
        isVisible
        isLoading={isLoading}
        colorScheme={colorScheme}
        infoMessage={infoMessage}
        ctaButton={{
          onPress: handleAccept,
          label: getBiometricsUIInfo().label,
        }}
        secondaryButton={{
          onPress: handleReject,
          label: 'Maybe later',
        }}
      />
    </View>
  )
}

export default BiometricsOptIn
