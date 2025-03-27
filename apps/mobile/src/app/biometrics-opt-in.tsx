import React, { useEffect } from 'react'
import { useColorScheme, Platform } from 'react-native'
import { OptIn } from '@/src/components/OptIn'
import { router } from 'expo-router'
import { useBiometrics } from '@/src/hooks/useBiometrics'

function BiometricsOptIn() {
  const { toggleBiometrics, getBiometricsButtonLabel, isBiometricsEnabled, isLoading } = useBiometrics()
  const colorScheme = useColorScheme()

  useEffect(() => {
    if (isBiometricsEnabled) {
      router.replace('/import-signers/private-key')
    }
  }, [isBiometricsEnabled])

  const handleReject = () => {
    router.back()
  }

  const handleAccept = () => {
    toggleBiometrics(true)
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

  return (
    <OptIn
      testID="biometrics-opt-in-screen"
      title="Simplify access, enhance security"
      description="Enable biometrics to unlock the app quickly and confirm transactions securely using Face ID."
      image={image}
      isVisible
      isLoading={isLoading}
      colorScheme={colorScheme}
      ctaButton={{
        onPress: handleAccept,
        label: getBiometricsButtonLabel(),
      }}
      secondaryButton={{
        onPress: handleReject,
        label: 'Maybe later',
      }}
    />
  )
}

export default BiometricsOptIn
