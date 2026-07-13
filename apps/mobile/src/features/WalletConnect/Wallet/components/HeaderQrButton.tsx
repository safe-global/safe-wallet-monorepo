import React, { useCallback, useRef } from 'react'
import { Pressable } from 'react-native'
import { Circle } from 'tamagui'
import { router, useFocusEffect } from 'expo-router'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

export const HeaderQrButton: React.FC = () => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const isEnabled = useHasFeature(FEATURES.NATIVE_WALLETCONNECT) ?? false

  // Guard against double-taps pushing the route twice; reset when the header regains focus.
  const isOpeningRef = useRef(false)
  useFocusEffect(
    useCallback(() => {
      isOpeningRef.current = false
    }, []),
  )

  if (!isEnabled || !activeSafe) {
    return null
  }

  const onPress = () => {
    if (isOpeningRef.current) {
      return
    }
    isOpeningRef.current = true
    router.push('/wallet-connect-scan')
    // Fallback unlock in case the push is swallowed and the focus reset never fires.
    setTimeout(() => {
      isOpeningRef.current = false
    }, 500)
  }

  return (
    <Pressable onPress={onPress} accessibilityLabel="Scan WalletConnect QR" testID="navbar-qr-button">
      <Circle size={40} backgroundColor="$backgroundSkeleton">
        <SafeFontIcon name="scan" size={24} color="$color" />
      </Circle>
    </Pressable>
  )
}
