import { useState, useEffect, useCallback } from 'react'

import { useCurrentChain } from '@/hooks/useChains'
import useOnboard, { connectWallet, getConnectedWallet } from '@/hooks/wallets/useOnboard'
import { logError, Errors } from '@/services/exceptions'
import {
  getClientMeta,
  PAIRING_MODULE_STORAGE_ID,
  setPairingConnector,
  usePairingConnector,
  WalletConnectEvents,
} from '@/services/pairing/connector'
import { PAIRING_MODULE_LABEL } from '@/services/pairing/module'
import { formatPairingUri, isPairingSupported, killPairingSession } from '@/services/pairing/utils'
import WalletConnect from '@walletconnect/client'
import { WC_BRIDGE } from '@/config/constants'
import local from '@/services/local-storage/local'

/**
 * `useInitPairing` is responsible for WC session management, creating a session when:
 *
 * - no wallet is connected to onboard, deemed "initializing" pairing (disconnecting wallets via the UI)
 * - on WC 'disconnect' event (disconnecting via the app)
 */

// First session will be created by onboard's state subscription, only
// when there is no connected wallet
let hasInitialized = false

// WC has no flag to determine if a session is currently being created
let isConnecting = false

export const useInitPairing = () => {
  const onboard = useOnboard()
  const chain = useCurrentChain()
  const connector = usePairingConnector()

  const canConnect = !connector?.connected && !isConnecting
  const isSupported = isPairingSupported(chain?.disabledWallets)

  useEffect(() => {
    const _pairingConnector = new WalletConnect({
      bridge: WC_BRIDGE,
      storageId: local.getPrefixedKey(PAIRING_MODULE_STORAGE_ID),
      clientMeta: getClientMeta(),
    })

    setPairingConnector(_pairingConnector)
  }, [])

  const createSession = useCallback(() => {
    if (!canConnect || !chain || !isSupported || !onboard) {
      return
    }

    isConnecting = true
    connector
      ?.createSession({ chainId: +chain.chainId })
      .then(() => {
        isConnecting = false
      })
      .catch((e) => logError(Errors._303, e))
  }, [canConnect, chain, isSupported, onboard, connector])

  useEffect(() => {
    if (!onboard || !isSupported) {
      return
    }

    // Upon successful WC connection, connect it to onboard
    connector?.on(WalletConnectEvents.CONNECT, () => {
      connectWallet(onboard, {
        autoSelect: {
          label: PAIRING_MODULE_LABEL,
          disableModals: true,
        },
      })
    })

    connector?.on(WalletConnectEvents.DISCONNECT, () => {
      createSession()
    })

    // Create new session when no wallet is connected to onboard
    const subscription = onboard.state.select('wallets').subscribe((wallets) => {
      if (!getConnectedWallet(wallets) && !hasInitialized) {
        createSession()
        hasInitialized = true
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [onboard, createSession, isSupported, connector])

  /**
   * It's not possible to update the `chainId` of the current WC session
   * We therefore kill the current session when switching chain to trigger
   * a new `createSession` above
   */
  useEffect(() => {
    // We need to wait for chains to have been fetched before killing the session
    if (!chain) {
      return
    }

    const isConnected = +chain.chainId === connector?.chainId
    const shouldKillSession = !isSupported || (!isConnected && hasInitialized && canConnect)

    if (!shouldKillSession || !connector) {
      return
    }

    killPairingSession(connector)
  }, [chain, isSupported, canConnect, connector])
}

/**
 * `usePairingUri` is responsible for returning to pairing URI
 * @returns uri - "safe-" prefixed WC connection URI
 */
const usePairingUri = () => {
  const connector = usePairingConnector()
  const [uri, setUri] = useState(connector ? formatPairingUri(connector.uri) : undefined)

  useEffect(() => {
    connector?.on(WalletConnectEvents.DISPLAY_URI, (_, { params }) => {
      setUri(formatPairingUri(params[0]))
    })

    // Prevent the `connector` from setting state when not mounted.
    // Note: `off` clears _all_ listeners associated with that event
    return () => {
      connector?.off(WalletConnectEvents.DISPLAY_URI)
    }
  }, [connector])

  return uri
}

export default usePairingUri
