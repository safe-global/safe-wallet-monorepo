import React, { useCallback, useRef, useState } from 'react'
import { Text, YStack } from 'tamagui'
import type { Code } from 'react-native-vision-camera'
import { useRouter, useFocusEffect } from 'expo-router'
import { useToastController, ToastViewport } from '@tamagui/toast'
import { isPairingUri } from '@safe-global/utils/features/walletconnect/utils'
import { QrCamera } from '@/src/components/Camera'
import { useCameraPermissionFlow } from '@/src/components/Camera/useCameraPermissionFlow'
import { getWalletKit } from '../walletKit'
import { logWalletKitError } from '../utils/errors'
import { WalletConnectDebugPasteInput } from './WalletConnectDebugPasteInput'

const TIMEOUT_MS = 10_000

const headingForPermission = (permission: ReturnType<typeof useCameraPermissionFlow>['permission']): string => {
  switch (permission) {
    case 'denied':
      return 'Camera access is off'
    case 'restricted':
      return 'Camera access is restricted'
    case 'not-determined':
      return 'Allow camera access'
    default:
      return 'Scan a WalletConnect QR code'
  }
}

const bodyForPermission = (permission: ReturnType<typeof useCameraPermissionFlow>['permission']): string => {
  switch (permission) {
    case 'denied':
      return 'Enable camera access to scan a WalletConnect QR code. You can change this in Settings.'
    case 'restricted':
      return 'Camera access is disabled by a device restriction. If you manage this device, you can change it in Settings.'
    case 'not-determined':
      return 'Safe needs camera access to scan a WalletConnect QR code.'
    default:
      return "Scan a dApp's WalletConnect QR code to connect."
  }
}

export function WalletConnectScanContainer() {
  const router = useRouter()
  const toast = useToastController()
  const { permission, requestPermission, openSettings } = useCameraPermissionFlow()
  const [isCameraActive, setIsCameraActive] = useState(false)
  // Guards against a second pair attempt while one is in flight (rapid re-scans).
  const pairingRef = useRef(false)
  // Set true when the timeout fires; later state writes for that attempt are no-ops.
  const cancelledRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (permission === 'granted') {
        setIsCameraActive(true)
      }
      return () => {
        setIsCameraActive(false)
        clearTimer()
      }
    }, [permission]),
  )

  const startPair = useCallback(
    async (uri: string) => {
      if (pairingRef.current) {
        return
      }
      pairingRef.current = true
      cancelledRef.current = false
      setIsCameraActive(false)
      timerRef.current = setTimeout(() => {
        cancelledRef.current = true
        timerRef.current = null
        pairingRef.current = false
        toast.show('Connection timed out. Try again.', { native: false, duration: 3000 })
        setIsCameraActive(true)
      }, TIMEOUT_MS)
      try {
        const wk = await getWalletKit()
        await wk.pair({ uri })
        if (cancelledRef.current) {
          return // timed out before we got here; the toast already fired
        }
        clearTimer()
        pairingRef.current = false
        // The proposal surfaces via the session_proposal subscription → RequestSheetHost,
        // which renders over the screen we return to.
        router.back()
      } catch (e) {
        if (cancelledRef.current) {
          return
        }
        clearTimer()
        pairingRef.current = false
        logWalletKitError('pair failed', e)
        toast.show(e instanceof Error ? e.message : 'Failed to pair', { native: false, duration: 3000 })
        setIsCameraActive(true)
      }
    },
    [router, toast],
  )

  const onScan = useCallback(
    (codes: Code[]) => {
      const raw = codes[0]?.value
      if (!raw || !isPairingUri(raw) || pairingRef.current) {
        // Ignore non-wc QRs silently — keep scanning.
        return
      }
      void startPair(raw)
    },
    [startPair],
  )

  return (
    <>
      <QrCamera
        permission={permission}
        isCameraActive={isCameraActive}
        onScan={onScan}
        onActivateCamera={() => setIsCameraActive(true)}
        onRequestPermission={requestPermission}
        onPressSettings={openSettings}
        heading={headingForPermission(permission)}
        footer={
          <YStack gap="$3">
            <Text textAlign="center">{bodyForPermission(permission)}</Text>
            <WalletConnectDebugPasteInput onPair={startPair} />
          </YStack>
        }
      />
      <ToastViewport multipleToasts={false} left={0} right={0} />
    </>
  )
}
