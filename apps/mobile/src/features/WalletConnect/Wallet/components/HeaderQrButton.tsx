import React, { useState } from 'react'
import { Pressable } from 'react-native'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { QrScannerSheet } from './QrScannerSheet'

export const HeaderQrButton: React.FC = () => {
  const activeSafe = useAppSelector(selectActiveSafe)
  const isEnabled = useHasFeature(FEATURES.NATIVE_WALLETCONNECT) ?? false
  const [open, setOpen] = useState(false)

  if (!isEnabled || !activeSafe) {
    return null
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel="Scan WalletConnect QR"
        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
      >
        <SafeFontIcon name="qr-code" />
      </Pressable>
      <QrScannerSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
