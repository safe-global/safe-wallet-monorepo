import { useEffect } from 'react'
import { useToastController } from '@tamagui/toast'

type WcToastOptions = { native?: boolean; duration?: number; variant?: 'error' }
type WcToastShow = (title: string, options?: WcToastOptions) => void

// Tamagui's toast is context-only (useToastController), but the walletKit listener middleware
// runs outside React and needs to surface user-facing toasts (no-signer, unsupported method,
// wrong active chain). This bridges the two: a root-level hook registers the live controller,
// and the middleware calls showWcToast imperatively. No-op until the bridge is mounted.
let currentShow: WcToastShow | null = null

export const showWcToast: WcToastShow = (title, options) => {
  currentShow?.(title, options)
}

/**
 * Registers the active toast controller so the walletKit listener can show toasts from outside
 * React. Mounted once inside WalletKitProvider; unregisters on unmount.
 */
export const useWcToastBridge = () => {
  const toast = useToastController()
  useEffect(() => {
    currentShow = (title, options) => toast.show(title, options)
    return () => {
      currentShow = null
    }
  }, [toast])
}
