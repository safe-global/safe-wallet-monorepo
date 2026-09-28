import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { getSdkError } from '@walletconnect/utils'
import { formatJsonRpcError } from '@walletconnect/jsonrpc-utils'
import type { SessionTypes } from '@walletconnect/types'
import type { WalletKitTypes } from '@reown/walletkit'

import useSafeInfo from '@/hooks/useSafeInfo'
import useSafeWalletProvider from '@/services/safe-wallet-provider/useSafeWalletProvider'
import { IS_PRODUCTION } from '@/config/constants'
import { getEip155ChainId, getPeerName, isExpiredProposalError, stripEip155Prefix } from '../../services/utils'
import { trackRequest } from '../../services/tracking'
import { wcPopupStore } from '../../store/wcPopupStore'
import type WalletConnectWallet from '../../services/WalletConnectWallet'
import walletConnectInstance from '../../services/walletConnectInstance'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useMatchingSafeApp } from '../../hooks/useMatchingSafeApp'
import { useIsSafeAppSuggested, useIsSuggestionFeatureEnabled } from '../../hooks/useSafeAppSuggestion'
import type { WalletConnectContextType, WcAutoApproveProps } from '../../types'
import { WCLoadingState } from '../../types'

enum Errors {
  WRONG_CHAIN = '%%dappName%% made a request on a different chain than the one you are connected to',
  EXPIRED_PROPOSAL = 'This connection request has expired. Please start a new connection from the dApp.',
}

const WC_AUTO_APPROVE_KEY = 'wcAutoApprove'

const FALLBACK_PEER_NAME = 'WalletConnect'

// The URL of the former WalletConnect Safe App
// This is still used to differentiate these txs from Safe App txs in the analytics
const LEGACY_WC_APP_URL = 'https://apps-portal.safe.global/wallet-connect'

const getWrongChainError = (dappName: string): Error => {
  const message = Errors.WRONG_CHAIN.replace('%%dappName%%', dappName)
  return new Error(message)
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
  matchingSafeApp: undefined,
  isMatchingSafeAppLoading: false,
  isSuggestionFeatureEnabled: false,
  isSafeAppSuggested: false,
  showSuggestion: false,
  isSuggestionResolved: false,
  setSuggestionResolved: () => {},
  dontShowAgain: false,
  setDontShowAgain: () => {},
})

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

  // The owned-safes list is only needed for dApp-initiated chain switches, so enable it once a
  // session exists.
  const safeWalletProvider = useSafeWalletProvider(sessions.length > 0)
  const [autoApprove = {}, setAutoApprove] = useLocalStorage<WcAutoApproveProps>(WC_AUTO_APPROVE_KEY)

  // Init WalletConnect
  useEffect(() => {
    walletConnectInstance
      .init()
      .then(() => setWalletConnect(walletConnectInstance))
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
  // --- Proposals
  //
  const [sessionProposal, setSessionProposal] = useState<WalletKitTypes.SessionProposal | null>(null)
  // Owned here rather than in the form so that dismissing the popup can tell whether the
  // Safe App suggestion was still on screen
  const [isSuggestionResolved, setSuggestionResolved] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const isSuggestionFeatureEnabled = useIsSuggestionFeatureEnabled()

  // Matched on the origin WalletConnect observed, never on proposer.metadata.url, which the
  // dApp declares about itself and can point at any domain it likes. Left undefined when the
  // feature is off so the query is skipped entirely rather than fetched and ignored.
  const proposalDappUrl = isSuggestionFeatureEnabled ? sessionProposal?.verifyContext.verified.origin : undefined
  const { safeApp: matchingSafeApp, isLoading: isMatchingSafeAppLoading } = useMatchingSafeApp(proposalDappUrl)

  // Derived once here: auto-approve, the session manager and the popup close handler all need
  // the same answer, and re-deriving it per consumer let them drift
  const isSafeAppSuggested = useIsSafeAppSuggested(sessionProposal, matchingSafeApp)
  const showSuggestion = Boolean(matchingSafeApp && isSafeAppSuggested && !isSuggestionResolved)

  const approveSession = useCallback(async () => {
    if (!walletConnect || !sessionProposal) return

    setLoading(WCLoadingState.APPROVE)

    try {
      await walletConnect.approveSession(sessionProposal, chainId, safeAddress, {
        atomic: JSON.stringify({ status: 'supported' }),
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
      // An expired proposal can never be approved, so drop it instead of leaving the
      // user stuck on a dialog whose only actions keep failing
      if (isSuggestionFeatureEnabled && isExpiredProposalError(e as Error)) {
        setSessionProposal(null)
        throw new Error(Errors.EXPIRED_PROPOSAL)
      }
      throw e
    }

    setLoading(null)
    setSessionProposal(null)
    setOpen(false)
  }, [walletConnect, sessionProposal, chainId, safeAddress, setAutoApprove, setOpen, isSuggestionFeatureEnabled])

  // Auto approve previously approved non-malicious dApps. Skipped while the Safe App lookup is
  // in flight, and when this dApp is eligible for the suggestion so the user gets to choose.
  // Gated on eligibility, not merely on a match: a matched dApp the suggestion would never be
  // shown for must keep auto-approving.
  useEffect(() => {
    if (!sessionProposal || isMatchingSafeAppLoading || (matchingSafeApp && isSafeAppSuggested)) return

    if (autoApprove[chainId]?.[sessionProposal.verifyContext.verified.origin]) {
      approveSession().catch((e) => {
        setError(e as Error)
      })
    }
  }, [
    autoApprove,
    approveSession,
    sessionProposal,
    chainId,
    matchingSafeApp,
    isSafeAppSuggested,
    isMatchingSafeAppLoading,
  ])

  const rejectSession = useCallback(async () => {
    if (!walletConnect || !sessionProposal) return

    setLoading(WCLoadingState.REJECT)

    try {
      await walletConnect.rejectSession(sessionProposal)
    } catch (e) {
      setLoading(null)
      // The proposal is already gone, so treat the rejection as done rather than
      // leaving the user on a dialog they cannot dismiss
      if (isSuggestionFeatureEnabled && isExpiredProposalError(e as Error)) {
        setSessionProposal(null)
        throw new Error(Errors.EXPIRED_PROPOSAL)
      }
      throw e
    }

    setLoading(null)
    setSessionProposal(null)
    setOpen(false)
  }, [walletConnect, sessionProposal, setOpen, isSuggestionFeatureEnabled])

  // Subscribe to session proposals
  useEffect(() => {
    return walletConnect?.onSessionPropose((proposalData) => {
      setLoading(null)
      // A proposal can arrive just after the connection timeout fired. The error screen takes
      // precedence over the proposal, so clear it or the request stays hidden behind a message
      // that is no longer true.
      if (isSuggestionFeatureEnabled) setError(null)
      // Each proposal gets its own suggestion
      setSuggestionResolved(false)
      setDontShowAgain(false)
      setSessionProposal(proposalData)
    })
  }, [walletConnect, isSuggestionFeatureEnabled])

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
        matchingSafeApp,
        isMatchingSafeAppLoading,
        isSuggestionFeatureEnabled,
        isSafeAppSuggested,
        showSuggestion,
        isSuggestionResolved,
        setSuggestionResolved,
        dontShowAgain,
        setDontShowAgain,
      }}
    >
      {children}
    </WalletConnectContext.Provider>
  )
}
