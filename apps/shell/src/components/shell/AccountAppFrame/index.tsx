import { useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { PROTOCOL_VERSION, type BaseMessage, type AccountToShellMessage } from '@safe-global/shell-protocol'
import { getShellCommunicator } from '@/services/shell-communicator'
import { useWallet } from '@/hooks/useWallet'
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
  const { wallet } = useWallet()
  const communicator = useMemo(() => getShellCommunicator(), [])

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

  // Set iframe window reference when loaded
  useEffect(() => {
    const iframe = iframeRef.current
    if (iframe?.contentWindow) {
      communicator.setIframeWindow(iframe.contentWindow)
    }
  }, [communicator])

  // Send wallet state updates to iframe
  useEffect(() => {
    if (!wallet) {
      communicator.sendWalletState({
        address: null,
        chainId: null,
        isConnected: false,
        label: null,
      })
      return
    }

    communicator.sendWalletState({
      address: wallet.address,
      chainId: wallet.chainId,
      isConnected: true,
      label: wallet.label,
      ens: wallet.ens,
      balance: wallet.balance,
    })
  }, [wallet, communicator])

  // Handle incoming messages from account app
  useEffect(() => {
    // Handle APP_READY
    const unsubscribeReady = communicator.on('APP_READY', (msg) => {
      if (msg.payload.type !== 'APP_READY') return
      console.log('[Shell] Account app ready:', msg.payload.payload)
      // Send initial wallet state
      if (wallet) {
        communicator.sendWalletState({
          address: wallet.address,
          chainId: wallet.chainId,
          isConnected: true,
          label: wallet.label,
          ens: wallet.ens,
          balance: wallet.balance,
        })
      }
    })

    // Handle NAVIGATION_CHANGED
    const unsubscribeNav = communicator.on('NAVIGATION_CHANGED', (msg) => {
      if (msg.payload.type !== 'NAVIGATION_CHANGED') return
      console.log('[Shell] Navigation changed:', msg.payload.payload)
      const { path, query } = msg.payload.payload
      router.replace({ pathname: path, query }, undefined, { shallow: true })
    })

    // Handle REQUEST_WALLET_STATE
    const unsubscribeWalletState = communicator.on('REQUEST_WALLET_STATE', (msg) => {
      console.log('[Shell] Wallet state requested')
      const requestId = 'requestId' in msg.payload ? msg.payload.requestId : ''
      if (wallet) {
        communicator.sendResponse(requestId, {
          address: wallet.address,
          chainId: wallet.chainId,
          isConnected: true,
          label: wallet.label,
          ens: wallet.ens,
          balance: wallet.balance,
        })
      } else {
        communicator.sendResponse(requestId, {
          address: null,
          chainId: null,
          isConnected: false,
          label: null,
        })
      }
    })

    // Handle REQUEST_CONNECT_WALLET
    const unsubscribeConnect = communicator.on('REQUEST_CONNECT_WALLET', (msg) => {
      console.log('[Shell] Wallet connection requested')
      const requestId = 'requestId' in msg.payload ? msg.payload.requestId : ''
      // TODO: Trigger wallet connection modal
      communicator.sendResponse(requestId, undefined, 'Not implemented yet')
    })

    // Handle RPC_REQUEST
    const unsubscribeRpc = communicator.on('RPC_REQUEST', (msg) => {
      if (msg.payload.type !== 'RPC_REQUEST') return
      console.log('[Shell] RPC request:', msg.payload.payload)
      const requestId = msg.payload.requestId
      // TODO: Forward RPC request to wallet provider
      communicator.sendResponse(requestId, undefined, 'Not implemented yet')
    })

    return () => {
      unsubscribeReady()
      unsubscribeNav()
      unsubscribeWalletState()
      unsubscribeConnect()
      unsubscribeRpc()
    }
  }, [router, wallet, communicator])

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
