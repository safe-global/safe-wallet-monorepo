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

  // Guard against rapid double-taps pushing the scanner route multiple times. Reset when the
  // header regains focus, i.e. the scanner sheet was dismissed and it can be opened again.
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
  }

  return (
    <Pressable onPress={onPress} accessibilityLabel="Scan WalletConnect QR" testID="navbar-qr-button">
      <Circle size={40} backgroundColor="$backgroundSkeleton">
        <SafeFontIcon name="scan" size={24} color="$color" />
      </Circle>
    </Pressable>
  )
}
