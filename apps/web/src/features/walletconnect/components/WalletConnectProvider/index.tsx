import { type ReactNode, useEffect, useState } from 'react'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'

import useSafeInfo from '@/hooks/useSafeInfo'
import useSafeWalletProvider from '@/services/safe-wallet-provider/useSafeWalletProvider'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { IS_PRODUCTION } from '@/config/constants'
import { getPeerName, stripEip155Prefix } from '@/features/walletconnect/services/utils'
import { trackRequest } from '@/features/walletconnect//services/tracking'
import { wcPopupStore } from '@/features/walletconnect/components'
import WalletConnectWallet from '@/features/walletconnect/services/WalletConnectWallet'
import { WalletConnectContext } from '@/features/walletconnect/WalletConnectContext'

enum Errors {
  WRONG_CHAIN = '%%dappName%% made a request on a different chain than the one you are connected to',
}

export enum WCLoadingState {
  APPROVE = 'Approve',
  REJECT = 'Reject',
  CONNECT = 'Connect',
  DISCONNECT = 'Disconnect',
}

// The URL of the former WalletConnect Safe App
// This is still used to differentiate these txs from Safe App txs in the analytics
const LEGACY_WC_APP_URL = 'https://apps-portal.safe.global/wallet-connect'

const walletConnectSingleton = new WalletConnectWallet()

const getWrongChainError = (dappName: string): Error => {
  const message = Errors.WRONG_CHAIN.replace('%%dappName%%', dappName)
  return new Error(message)
}

export const WalletConnectProvider = ({ children }: { children: ReactNode }) => {
  const {
    safe: { chainId },
    safeAddress,
  } = useSafeInfo()
  const [walletConnect, setWalletConnect] = useState<WalletConnectWallet | null>(null)
  const open = wcPopupStore.useStore() ?? false
  const setOpen = wcPopupStore.setStore
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<WCLoadingState>()
  const safeWalletProvider = useSafeWalletProvider()

  // Init WalletConnect
  useEffect(() => {
    walletConnectSingleton
      .init()
      .then(() => setWalletConnect(walletConnectSingleton))
      .catch(setError)
  }, [])

  // Update chainId/safeAddress
  useEffect(() => {
    if (!walletConnect || !chainId || !safeAddress) return

    walletConnect.updateSessions(chainId, safeAddress).catch(setError)
  }, [walletConnect, chainId, safeAddress])

  // Subscribe to requests
  useEffect(() => {
    if (!walletConnect || !safeWalletProvider || !chainId) return

    return walletConnect.onRequest(async (event) => {
      if (!IS_PRODUCTION) {
        console.log('[WalletConnect] request', event)
      }

      const { topic } = event
      const session = walletConnect.getActiveSessions().find((s) => s.topic === topic)
      const requestChainId = stripEip155Prefix(event.params.chainId)

      // Track requests
      if (session) {
        trackRequest(session.peer.metadata.url, event.params.request.method)
      }

      const getResponse = () => {
        // Get error if wrong chain
        if (!session || requestChainId !== chainId) {
          if (session) {
            setError(getWrongChainError(getPeerName(session.peer)))
          }

          const error = getSdkError('UNSUPPORTED_CHAINS')
          return formatJsonRpcError(event.id, error)
        }

        // Get response from Safe Wallet Provider
        return safeWalletProvider.request(event.id, event.params.request, {
          url: LEGACY_WC_APP_URL, // required for server-side analytics
          name: getPeerName(session.peer) || 'WalletConnect',
          description: session.peer.metadata.description,
          iconUrl: session.peer.metadata.icons[0],
        })
      }

      try {
        const response = await getResponse()

        // Send response to WalletConnect
        await walletConnect.sendSessionResponse(topic, response)
      } catch (e) {
        setError(asError(e))
      }
    })
  }, [walletConnect, chainId, safeWalletProvider])

  return (
    <WalletConnectContext.Provider value={{ walletConnect, error, setError, open, setOpen, isLoading, setIsLoading }}>
      {children}
    </WalletConnectContext.Provider>
  )
}
