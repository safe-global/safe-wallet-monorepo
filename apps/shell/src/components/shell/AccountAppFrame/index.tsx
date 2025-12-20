import { useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { PROTOCOL_VERSION, type BaseMessage, type AccountToShellMessage } from '@safe-global/shell-protocol'
import css from './styles.module.css'

interface AccountAppFrameProps {
  safeAddress: string
  chainPrefix: string
}

/**
 * Iframe container for the account app
 * Handles loading the account app and postMessage communication
 */
const AccountAppFrame = ({ safeAddress, chainPrefix }: AccountAppFrameProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const router = useRouter()

  // Build iframe URL
  const iframeUrl = useMemo(() => {
    const baseUrl = process.env.NEXT_PUBLIC_ACCOUNT_APP_URL || '/account-app'
    const url = new URL(baseUrl, window.location.origin)

    // Forward the current path
    url.pathname = router.pathname === '/' ? baseUrl : `${baseUrl}${router.pathname}`

    // Add safe query param
    url.searchParams.set('safe', `${chainPrefix}:${safeAddress}`)

    // Forward other query params (except safe, which we already set)
    Object.entries(router.query).forEach(([key, value]) => {
      if (key !== 'safe' && typeof value === 'string') {
        url.searchParams.set(key, value)
      }
    })

    return url.toString()
  }, [router.pathname, router.query, chainPrefix, safeAddress])

  // Handle incoming messages from account app
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin (in production, should check specific origin)
      const msg = event.data as BaseMessage<AccountToShellMessage>

      // Validate message is from account app
      if (msg.source !== 'safe-account-app') {
        return
      }

      // Check protocol version
      if (msg.version !== PROTOCOL_VERSION) {
        console.warn(`Protocol version mismatch: expected ${PROTOCOL_VERSION}, got ${msg.version}`)
      }

      // Handle different message types
      switch (msg.payload.type) {
        case 'APP_READY':
          console.log('[Shell] Account app ready:', msg.payload.payload)
          // TODO: Send initial wallet state
          break

        case 'NAVIGATION_CHANGED':
          console.log('[Shell] Navigation changed:', msg.payload.payload)
          // Sync URL without reload
          const { path, query } = msg.payload.payload
          router.replace({ pathname: path, query }, undefined, { shallow: true })
          break

        case 'REQUEST_WALLET_STATE':
          console.log('[Shell] Wallet state requested')
          // TODO: Send wallet state
          break

        case 'REQUEST_CONNECT_WALLET':
          console.log('[Shell] Wallet connection requested')
          // TODO: Trigger wallet connection
          break

        case 'RPC_REQUEST':
          console.log('[Shell] RPC request:', msg.payload.payload)
          // TODO: Forward RPC request to wallet provider
          break

        default:
          console.log('[Shell] Unknown message type:', msg.payload)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [router])

  return (
    <div className={css.container}>
      <iframe
        ref={iframeRef}
        src={iframeUrl}
        className={css.iframe}
        title="Safe Account"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        allow="clipboard-write"
      />
    </div>
  )
}

export default AccountAppFrame
