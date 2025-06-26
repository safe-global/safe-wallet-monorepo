import { useCallback, useContext, useEffect } from 'react'
import { WalletConnectContext } from '@/features/walletconnect/WalletConnectContext'
import WcConnectionForm from '../WcConnectionForm'
import WcErrorMessage from '../WcErrorMessage'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { splitError } from '@/features/walletconnect/services/utils'
import WcProposalForm from '../WcProposalForm'

type WcSessionManagerProps = {
  uri: string
}

const WcSessionManager = ({ uri }: WcSessionManagerProps) => {
  const { sessions, sessionProposal, error, setError, open, approveSession, rejectSession } =
    useContext(WalletConnectContext)

  // On session approve
  const onApprove = useCallback(async () => {
    if (!sessionProposal) return

    const label = sessionProposal.params.proposer.metadata.url
    trackEvent({ ...WALLETCONNECT_EVENTS.APPROVE_CLICK, label })

    try {
      await approveSession()
    } catch (e) {
      setError(e as Error)
      return
    }

    trackEvent({ ...WALLETCONNECT_EVENTS.CONNECTED, label })
  }, [sessionProposal, approveSession, setError])

  // On session reject
  const onReject = useCallback(async () => {
    if (!sessionProposal) return

    const label = sessionProposal.params.proposer.metadata.url
    trackEvent({ ...WALLETCONNECT_EVENTS.REJECT_CLICK, label })

    try {
      await rejectSession()
    } catch (e) {
      setError(e as Error)
    }
  }, [sessionProposal, rejectSession, setError])

  // Reset error
  const onErrorReset = useCallback(() => {
    setError(null)
  }, [setError])

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
  if (sessionProposal) {
    return <WcProposalForm proposal={sessionProposal} onApprove={onApprove} onReject={onReject} />
  }

  // Connection form (initial state)
  return <WcConnectionForm sessions={sessions} uri={uri} />
}

export default WcSessionManager
