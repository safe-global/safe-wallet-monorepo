import { useCallback, useRef, useState } from 'react'
import { useRouter, useFocusEffect } from 'expo-router'
import type { Code } from 'react-native-vision-camera'
import { isPairingUri } from '@safe-global/utils/features/walletconnect/utils'
import { useCameraPermissionFlow } from '@/src/components/Camera'
import { getWalletKit } from '../walletKit'
import { logWalletKitError } from '../utils/errors'

const TIMEOUT_MS = 10_000
const UNRECOGNISED_MESSAGE = 'Unrecognised QR code'
const TIMEOUT_MESSAGE = 'Connection timed out. Try again.'

export type ScanStatus = 'scanning' | 'connecting' | 'error'

export const useWalletConnectScan = () => {
  const router = useRouter()
  const { permission, requestPermission, openSettings } = useCameraPermissionFlow()
  const [status, setStatus] = useState<ScanStatus>('scanning')
  const [errorMessage, setErrorMessage] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)

  // Guards a second pair attempt while one is in flight (rapid re-scans).
  const pairingRef = useRef(false)
  // Set true when the timeout fires; later writes for that attempt become no-ops.
  const cancelledRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const toError = useCallback((message: string) => {
    setErrorMessage(message)
    setStatus('error')
    setIsCameraActive(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (permission === 'granted' && status === 'scanning') {
        setIsCameraActive(true)
      }
      return () => {
        setIsCameraActive(false)
        clearTimer()
      }
    }, [permission, status]),
  )

  const startPair = useCallback(
    async (uri: string) => {
      if (pairingRef.current) {
        return
      }
      pairingRef.current = true
      cancelledRef.current = false
      setStatus('connecting')
      setIsCameraActive(false)
      timerRef.current = setTimeout(() => {
        cancelledRef.current = true
        timerRef.current = null
        pairingRef.current = false
        toError(TIMEOUT_MESSAGE)
      }, TIMEOUT_MS)
      try {
        const wk = await getWalletKit()
        await wk.pair({ uri })
        if (cancelledRef.current) {
          return // timed out first; the error overlay already shows
        }
        clearTimer()
        pairingRef.current = false
        // Proposal surfaces via the global RequestSheetHost on the screen below.
        router.back()
      } catch (e) {
        if (cancelledRef.current) {
          return
        }
        clearTimer()
        pairingRef.current = false
        logWalletKitError('pair failed', e)
        toError(e instanceof Error ? e.message : 'Failed to pair')
      }
    },
    [router, toError],
  )

  const onScan = useCallback(
    (scanned: Code[]) => {
      const raw = scanned[0]?.value
      if (!raw || pairingRef.current || status !== 'scanning') {
        return
      }
      if (!isPairingUri(raw)) {
        toError(UNRECOGNISED_MESSAGE)
        return
      }
      void startPair(raw)
    },
    [startPair, toError, status],
  )

  const onTryAgain = useCallback(() => {
    setErrorMessage('')
    setStatus('scanning')
    if (permission === 'granted') {
      setIsCameraActive(true)
    }
  }, [permission])

  const onActivateCamera = useCallback(() => setIsCameraActive(true), [])

  return {
    status,
    errorMessage,
    isCameraActive,
    permission,
    requestPermission,
    openSettings,
    onScan,
    onTryAgain,
    onActivateCamera,
    startPair,
  }
}
