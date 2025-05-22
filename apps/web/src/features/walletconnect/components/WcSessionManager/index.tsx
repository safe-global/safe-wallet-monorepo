import { WCLoadingState } from '@/features/walletconnect/components/WalletConnectProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useCallback, useContext, useEffect, useState } from 'react'
import type { WalletKitTypes } from '@reown/walletkit'
import type { SessionTypes } from '@walletconnect/types'
import { WalletConnectContext } from '@/features/walletconnect/WalletConnectContext'
import WcConnectionForm from '../WcConnectionForm'
import WcErrorMessage from '../WcErrorMessage'
import WcProposalForm from '../WcProposalForm'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { splitError } from '@/features/walletconnect/services/utils'

type WcSessionManagerProps = {
  sessions: SessionTypes.Struct[]
  uri: string
}

// chainId -> origin -> boolean
type WcAutoApproveProps = Record<string, Record<string, boolean>>

const WC_AUTO_APPROVE_KEY = 'wcAutoApprove'

const WcSessionManager = ({ sessions, uri }: WcSessionManagerProps) => {
  const [autoApprove = {}, setAutoApprove] = useLocalStorage<WcAutoApproveProps>(WC_AUTO_APPROVE_KEY)
  const { walletConnect, error, setError, open, setOpen, setIsLoading } = useContext(WalletConnectContext)
  const { safe, safeAddress } = useSafeInfo()
  const { chainId } = safe
  const [proposal, setProposal] = useState<WalletKitTypes.SessionProposal>()

  // On session approve
  const onApprove = useCallback(
    async (proposalData?: WalletKitTypes.SessionProposal) => {
      const sessionProposal = proposalData || proposal

      if (!walletConnect || !chainId || !safeAddress || !sessionProposal) return

      const label = sessionProposal?.params.proposer.metadata.url
      trackEvent({ ...WALLETCONNECT_EVENTS.APPROVE_CLICK, label })

      setIsLoading(WCLoadingState.APPROVE)

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

        // Auto approve future sessions for non-malicious dApps
        if (
          sessionProposal.verifyContext.verified.validation !== 'INVALID' &&
          !sessionProposal.verifyContext.verified.isScam
        ) {
          setAutoApprove((prev) => ({
            ...prev,
            [chainId]: { ...prev?.[chainId], [sessionProposal.verifyContext.verified.origin]: true },
          }))
        }

        setOpen(false)
      } catch (e) {
        setIsLoading(undefined)
        setError(asError(e))
        return
      }

      trackEvent({ ...WALLETCONNECT_EVENTS.CONNECTED, label })
      setIsLoading(undefined)
      setProposal(undefined)
    },
    [proposal, walletConnect, chainId, safeAddress, setIsLoading, setOpen, setAutoApprove, setError],
  )

  // Reset error
  const onErrorReset = useCallback(() => {
    setError(null)
  }, [setError])

  // Subscribe to session proposals
  useEffect(() => {
    if (!walletConnect) return
    return walletConnect.onSessionPropose((proposalData) => {
      setError(null)

      if (autoApprove[chainId]?.[proposalData.verifyContext.verified.origin]) {
        onApprove(proposalData)
        return
      }

      setProposal(proposalData)
      setIsLoading(undefined)
    })
  }, [autoApprove, chainId, onApprove, setError, setIsLoading, walletConnect])

  // Track errors
  useEffect(() => {
    if (error) {
      // The summary of the error
      const label = splitError(error.message || '')[0]
      trackEvent({ ...WALLETCONNECT_EVENTS.SHOW_ERROR, label })
    }
  }, [error])

  // Nothing to show
  if (!open) return null

  // Error
  if (error) {
    return <WcErrorMessage error={error} onClose={onErrorReset} />
  }

  // Session proposal
  if (proposal) {
    return <WcProposalForm proposal={proposal} setProposal={setProposal} onApprove={onApprove} />
  }

  // Connection form (initial state)
  return <WcConnectionForm sessions={sessions} uri={uri} />
}

export default WcSessionManager
