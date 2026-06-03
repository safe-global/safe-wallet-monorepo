import React from 'react'
import { Pressable } from 'react-native'
import { router } from 'expo-router'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'

export const HeaderQrButton: React.FC = () => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const isEnabled = useHasFeature(FEATURES.NATIVE_WALLETCONNECT) ?? false

  if (!isEnabled || !activeSafe) {
    return null
  }

  return (
    <Pressable
      onPress={() => router.push('/wallet-connect-scan')}
      accessibilityLabel="Scan WalletConnect QR"
      style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
    >
      <SafeFontIcon name="qr-code" />
    </Pressable>
  )
}
