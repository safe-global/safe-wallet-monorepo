import {
  createContext,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from 'react'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import type { SessionTypes } from '@walletconnect/types'
import type { WalletKitTypes } from '@reown/walletkit'

import useSafeInfo from '@/hooks/useSafeInfo'
import useSafeWalletProvider from '@/services/safe-wallet-provider/useSafeWalletProvider'
import { IS_PRODUCTION } from '@/config/constants'
import { getEip155ChainId, getPeerName, stripEip155Prefix } from '@/features/walletconnect/services/utils'
import { trackRequest } from '@/features/walletconnect/services/tracking'
import { wcPopupStore } from '@/features/walletconnect/components'
import WalletConnectWallet from '@/features/walletconnect/services/WalletConnectWallet'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

type WalletConnectContextType = {
  walletConnect: WalletConnectWallet | null
  sessions: SessionTypes.Struct[]
  sessionProposal: WalletKitTypes.SessionProposal | null
  error: Error | null
  setError: Dispatch<SetStateAction<Error | null>>
  open: boolean
  setOpen: (open: boolean) => void
  loading: WCLoadingState | null
  setLoading: Dispatch<SetStateAction<WCLoadingState | null>>
  approveSession: () => Promise<void>
  rejectSession: () => Promise<void>
}

export const WalletConnectContext = createContext<WalletConnectContextType>({
  walletConnect: null,
  sessions: [],
  sessionProposal: null,
  error: null,
  setError: () => {},
  open: false,
  setOpen: () => {},
  loading: null,
  setLoading: () => {},
  approveSession: () => Promise.resolve(),
  rejectSession: () => Promise.resolve(),
})

enum Errors {
  WRONG_CHAIN = '%%dappName%% made a request on a different chain than the one you are connected to',
}

export enum WCLoadingState {
  APPROVE = 'Approve',
  REJECT = 'Reject',
  CONNECT = 'Connect',
  DISCONNECT = 'Disconnect',
}

// chainId -> origin -> boolean
type WcAutoApproveProps = Record<string, Record<string, boolean>>

const WC_AUTO_APPROVE_KEY = 'wcAutoApprove'

const FALLBACK_PEER_NAME = 'WalletConnect'

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
  const [loading, setLoading] = useState<WCLoadingState | null>(null)
  const safeWalletProvider = useSafeWalletProvider()
  const [autoApprove = {}, setAutoApprove] = useLocalStorage<WcAutoApproveProps>(WC_AUTO_APPROVE_KEY)

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

  //
  // --- Subscribe to requests
  //
  useEffect(() => {
    if (!walletConnect || !safeWalletProvider || !chainId) return

    return walletConnect.onRequest(async (event) => {
      if (!IS_PRODUCTION) {
        console.log('[WalletConnect] request', event)
      }

      const { topic } = event
      const session = walletConnect.getActiveSessions().find((s) => s.topic === topic)
      const requestChainId = stripEip155Prefix(event.params.chainId)
      const peerName = (session && getPeerName(session.peer)) || FALLBACK_PEER_NAME

      // Track requests
      if (session) {
        trackRequest(session.peer.metadata.url, event.params.request.method)
      }

      const getResponse = () => {
        // Get error if wrong chain
        if (!session || requestChainId !== chainId) {
          if (session) {
            setError(getWrongChainError(peerName))
          }

          const error = getSdkError('UNSUPPORTED_CHAINS')
          return formatJsonRpcError(event.id, error)
        }

        // Get response from Safe Wallet Provider
        return safeWalletProvider.request(event.id, event.params.request, {
          url: LEGACY_WC_APP_URL, // required for server-side analytics
          name: peerName,
          description: session.peer.metadata.description,
          iconUrl: session.peer.metadata.icons[0],
        })
      }

      try {
        const response = await getResponse()

        // Send response to WalletConnect
        await walletConnect.sendSessionResponse(topic, response)
      } catch (e) {
        setError(e as Error)
      }
    })
  }, [walletConnect, chainId, safeWalletProvider])

  //
  // --- One-click Auth
  //
  useEffect(() => {
    if (!walletConnect || !safeWalletProvider || !chainId) return

    return walletConnect.onSessionAuth(async (event) => {
      const { authPayload, requester } = event.params
      const peerName = getPeerName(requester) || FALLBACK_PEER_NAME

      if (!IS_PRODUCTION) {
        console.log('[WalletConnect] auth', authPayload, requester)
      }

      if (!authPayload.chains.includes(getEip155ChainId(chainId))) {
        setError(getWrongChainError(peerName))
        return
      }

      const getSignature = async () => {
        const message = walletConnect.formatAuthMessage(authPayload, chainId, safeAddress)

        if (!IS_PRODUCTION) {
          console.log('[WalletConnect] SiWE message', message)
        }

        const appInfo = {
          url: LEGACY_WC_APP_URL, // required for server-side analytics
          name: peerName,
          description: requester.metadata.description,
          iconUrl: requester.metadata.icons[0],
        }

        return safeWalletProvider.request(
          event.id,
          {
            method: 'personal_sign',
            params: [message, safeAddress],
          },
          appInfo,
        )
      }

      // Close the popup
      setLoading(WCLoadingState.APPROVE)
      setOpen(false)

      // Get a signature and send it to WalletConnect
      try {
        const signature = await getSignature()
        if ('error' in signature) throw new Error(signature.error.message)
        await walletConnect.approveSessionAuth(event.id, authPayload, signature.result as string, chainId, safeAddress)
      } catch (e) {
        try {
          await walletConnect.rejectSessionAuth(event.id)
        } catch (err) {
          e = err
        }
        setError(e as Error)
        setOpen(true)
      }

      setLoading(null)
    })
  }, [walletConnect, safeWalletProvider, chainId, safeAddress, setOpen])

  //
  // --- Sessions
  //
  const [sessions, setSessions] = useState<SessionTypes.Struct[]>([])

  const updateSessions = useCallback(() => {
    walletConnect && setSessions(walletConnect.getActiveSessions())
  }, [walletConnect])

  // Initial sessions
  useEffect(updateSessions, [updateSessions])

  // On session add
  useEffect(() => {
    return walletConnect?.onSessionAdd(updateSessions)
  }, [walletConnect, updateSessions])

  // On session delete
  useEffect(() => {
    return walletConnect?.onSessionDelete(updateSessions)
  }, [walletConnect, updateSessions])

  //
  // --- Proposals
  //
  const [sessionProposal, setSessionProposal] = useState<WalletKitTypes.SessionProposal | null>(null)

  const approveSession = useCallback(async () => {
    if (!walletConnect || !sessionProposal) return

    setLoading(WCLoadingState.APPROVE)

    try {
      await walletConnect.approveSession(sessionProposal, chainId, safeAddress, {
        capabilities: JSON.stringify({
          [safeAddress]: {
            [`0x${Number(chainId).toString(16)}`]: {
              atomicBatch: {
                supported: true,
              },
            },
          },
        }),
      })

      // Add session to auto approve list
      if (
        sessionProposal.verifyContext.verified.validation !== 'INVALID' &&
        !sessionProposal.verifyContext.verified.isScam
      ) {
        setAutoApprove((prev) => ({
          ...prev,
          [chainId]: { ...prev?.[chainId], [sessionProposal.verifyContext.verified.origin]: true },
        }))
      }
    } catch (e) {
      setLoading(null)
      throw e
    }

    setLoading(null)
    setSessionProposal(null)
    setOpen(false)
  }, [walletConnect, sessionProposal, chainId, safeAddress, setAutoApprove, setOpen])

  // Auto approve previously approved non-malicious dApps
  useEffect(() => {
    if (sessionProposal && autoApprove[chainId]?.[sessionProposal.verifyContext.verified.origin]) {
      approveSession().catch((e) => {
        setError(e as Error)
      })
    }
  }, [autoApprove, approveSession, sessionProposal, chainId])

  const rejectSession = useCallback(async () => {
    if (!walletConnect || !sessionProposal) return

    setLoading(WCLoadingState.REJECT)

    try {
      await walletConnect.rejectSession(sessionProposal)
    } catch (e) {
      setLoading(null)
      throw e
    }

    setLoading(null)
    setSessionProposal(null)
    setOpen(false)
  }, [walletConnect, sessionProposal, setOpen])

  // Subscribe to session proposals
  useEffect(() => {
    return walletConnect?.onSessionPropose((proposalData) => {
      setLoading(null)
      setSessionProposal(proposalData)
    })
  }, [walletConnect])

  return (
    <WalletConnectContext.Provider
      value={{
        walletConnect,
        error,
        setError,
        open,
        setOpen,
        loading,
        setLoading,
        sessions,
        sessionProposal,
        approveSession,
        rejectSession,
      }}
    >
      {children}
    </WalletConnectContext.Provider>
  )
}
