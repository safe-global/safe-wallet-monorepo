import React, { useState, useEffect, useRef } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { Text, YStack, Button, View } from 'tamagui'
import type { Code } from 'react-native-vision-camera'
import { QrCamera } from '@/src/components/Camera/QrCamera'
import { useCameraPermissionFlow } from '@/src/components/Camera/useCameraPermissionFlow'
import { getWalletKit } from '../walletKit'

const isWcUri = (s: string) => s.startsWith('wc:')

const TIMEOUT_MS = 10_000

type Props = { open: boolean; onClose: () => void }

export const QrScannerSheet: React.FC<Props> = ({ open, onClose }) => {
  const ref = useRef<BottomSheetModal>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(true)
  const { permission, requestPermission, openSettings } = useCameraPermissionFlow()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Set true when the timeout fires; further state writes for this pair attempt are no-ops.
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (open) {
      ref.current?.present()
    } else {
      ref.current?.dismiss()
    }
  }, [open])

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Make sure a stale timer never fires after unmount.
  useEffect(() => () => clearTimer(), [])

  const startPair = async (uri: string) => {
    setConnecting(true)
    setError(null)
    setIsCameraActive(false)
    cancelledRef.current = false
    timerRef.current = setTimeout(() => {
      cancelledRef.current = true
      timerRef.current = null
      setError('Connection timed out. Try again.')
      setConnecting(false)
    }, TIMEOUT_MS)
    try {
      const wk = await getWalletKit()
      await wk.pair({ uri })
      // Proposal will surface via the session_proposal subscription → RequestSheetHost.
      if (cancelledRef.current) {
        return // timed out before we got here; leave the error visible
      }
      clearTimer()
      setConnecting(false)
      onClose()
    } catch (e) {
      if (cancelledRef.current) {
        return
      }
      clearTimer()
      setConnecting(false)
      setError(e instanceof Error ? e.message : 'Failed to pair')
    }
  }

  const onScan = (codes: Code[]) => {
    const raw = codes[0]?.value
    if (!raw || !isWcUri(raw)) {
      // Ignore non-wc QRs silently — keep scanning.
      return
    }
    void startPair(raw)
  }

  const onRetry = () => {
    setError(null)
    setIsCameraActive(true)
  }

  return (
    <BottomSheetModal ref={ref} snapPoints={['90%']} enableDynamicSizing={false} onDismiss={onClose}>
      <YStack flex={1} padding="$4" gap="$3">
        <Text fontWeight="600">Scan WalletConnect QR</Text>
        {!error && !connecting && (
          <View flex={1}>
            <QrCamera
              onScan={onScan}
              isCameraActive={isCameraActive}
              permission={permission}
              onActivateCamera={() => setIsCameraActive(true)}
              onRequestPermission={requestPermission}
              onPressSettings={openSettings}
              footer={null}
            />
          </View>
        )}
        {connecting && <Text>Connecting…</Text>}
        {error && (
          <YStack gap="$3" padding="$4" backgroundColor="$backgroundSecondary" borderRadius="$3">
            <Text color="$error">{error}</Text>
            <Button onPress={onRetry}>Try again</Button>
          </YStack>
        )}
      </YStack>
    </BottomSheetModal>
  )
}
