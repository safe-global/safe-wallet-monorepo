import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useFocusEffect } from 'expo-router'
import type { Code } from 'react-native-vision-camera'
import { isPairingUri } from '@safe-global/utils/features/walletconnect/utils'
import { useCameraPermissionFlow } from '@/src/components/Camera'
import { getWalletKit } from '../walletKit'
import { getPairErrorMessage, logWalletKitError } from '../utils/errors'
import { PAIR_TIMEOUT_MESSAGE, PAIR_TIMEOUT_MS } from '../utils/constants'

const UNRECOGNISED_MESSAGE = 'Unrecognised QR code'

export type ScanStatus = 'scanning' | 'connecting' | 'error'

export const useWalletConnectScan = () => {
  const router = useRouter()
  const { permission, requestPermission, openSettings } = useCameraPermissionFlow()
  const [status, setStatus] = useState<ScanStatus>('scanning')
  const [errorMessage, setErrorMessage] = useState('')
  const [isCameraActive, setIsCameraActive] = useState(false)

  // Mirror `status` in a ref so the focus effect can read the latest value WITHOUT
  // listing `status` in its deps (which would re-run the effect and clear the live timer).
  const statusRef = useRef(status)
  statusRef.current = status

  // Guards a second pair attempt while one is in flight (rapid re-scans).
  const pairingRef = useRef(false)
  // Set true when the timeout fires; later writes for that attempt become no-ops.
  const cancelledRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Flipped on unmount so a pair() that resolves afterwards can't write state or navigate.
  const mountedRef = useRef(true)
  useEffect(() => () => void (mountedRef.current = false), [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const toError = useCallback((message: string) => {
    setErrorMessage(message)
    setStatus('error')
    setIsCameraActive(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (permission === 'granted' && statusRef.current === 'scanning') {
        setIsCameraActive(true)
      }
      return () => {
        setIsCameraActive(false)
        clearTimer()
      }
    }, [permission, clearTimer]),
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
        toError(PAIR_TIMEOUT_MESSAGE)
      }, PAIR_TIMEOUT_MS)
      try {
        const wk = await getWalletKit()
        // WalletKit.pair() can't be aborted, so on timeout we only stop reacting here — the relay
        // pairing may still complete and surface a proposal later via the global RequestSheetHost.
        await wk.pair({ uri })
        if (cancelledRef.current || !mountedRef.current) {
          return // timed out first or unmounted; the error overlay already shows / nothing to do
        }
        clearTimer()
        pairingRef.current = false
        // Proposal surfaces via the global RequestSheetHost on the screen below.
        router.back()
      } catch (e) {
        if (cancelledRef.current || !mountedRef.current) {
          return
        }
        clearTimer()
        pairingRef.current = false
        logWalletKitError('pair failed', e)
        toError(getPairErrorMessage(e))
      }
    },
    [router, toError, clearTimer],
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
  }
}
