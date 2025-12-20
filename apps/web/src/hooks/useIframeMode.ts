import { useEffect, useState } from 'react'

/**
 * Detects if the app is running inside an iframe (as part of the Shell architecture)
 *
 * @returns {boolean} True if running in iframe, false if standalone
 */
export function useIframeMode(): boolean {
  const [isIframe, setIsIframe] = useState(false)

  useEffect(() => {
    // Check if window is different from parent (indicates iframe)
    setIsIframe(typeof window !== 'undefined' && window !== window.parent)
  }, [])

  return isIframe
}

/**
 * Hook to detect iframe mode and shell connection status
 *
 * @returns {object} Object containing isIframe and isConnectedToShell flags
 */
export function useShellConnection() {
  const isIframe = useIframeMode()
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!isIframe) return

    const handler = (event: MessageEvent) => {
      // Validate message is from shell
      if (event.data?.source === 'safe-shell' && event.data?.type === 'WALLET_STATE_CHANGED') {
        setIsConnected(true)
      }
    }

    window.addEventListener('message', handler)

    // Signal readiness to parent shell
    window.parent.postMessage(
      {
        source: 'safe-account-app',
        version: '1.0.0',
        type: 'APP_READY',
        payload: {
          version: process.env.NEXT_PUBLIC_COMMIT_HASH || 'dev',
        },
      },
      '*', // Will be restricted in production
    )

    return () => window.removeEventListener('message', handler)
  }, [isIframe])

  return { isIframe, isConnectedToShell: isConnected }
}
