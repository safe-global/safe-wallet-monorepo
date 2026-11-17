import { useCallback, useContext } from 'react'
import type { WalletKitTypes } from '@reown/walletkit'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { WalletConnectContext } from '../WalletConnectContext'
import WcProposalForm from '../WcProposalForm'
import WcSafeAppSuggestion from '../WcSafeAppSuggestion'
import { useSafeAppSuggestionActions } from '../../hooks/useSafeAppSuggestionActions'

const WcProposalStep = ({ proposal }: { proposal: WalletKitTypes.SessionProposal }) => {
  const { approveSession, rejectSession, setError, safeAppSuggestion } = useContext(WalletConnectContext)
  const { status, safeApp, isShown, remember, setRemember } = safeAppSuggestion
  const label = proposal.params.proposer.metadata.url

  const onApprove = useCallback(async (): Promise<boolean> => {
    trackEvent({ ...WALLETCONNECT_EVENTS.APPROVE_CLICK, label })

    try {
      await approveSession()
    } catch (e) {
      setError(e as Error)
      return false
    }

    trackEvent(
      { ...WALLETCONNECT_EVENTS.CONNECTED, label },
      {
        [MixpanelEventParams.APP_URL]: label,
        ...(status !== 'off' && { [MixpanelEventParams.SAFE_APP_AVAILABLE]: Boolean(safeApp) }),
      },
    )
    return true
  }, [label, approveSession, setError, status, safeApp])

  const onReject = useCallback(async () => {
    trackEvent({ ...WALLETCONNECT_EVENTS.REJECT_CLICK, label })

    try {
      await rejectSession()
    } catch (e) {
      setError(e as Error)
    }
  }, [label, rejectSession, setError])

  const { isLeaving, openSafeApp, browseSafeApps, continueWithWalletConnect } = useSafeAppSuggestionActions(onApprove)

  // The connection form must not be approvable in the moment before the suggestion or the Safe App replaces it
  if (status === 'loading' || status === 'redirect' || isLeaving) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  if (isShown && safeApp) {
    return (
      <WcSafeAppSuggestion
        safeApp={safeApp}
        origin={proposal.verifyContext.verified.origin}
        remember={remember}
        onRememberChange={setRemember}
        onOpenSafeApp={openSafeApp}
        onContinueWithWalletConnect={continueWithWalletConnect}
        onBrowseSafeApps={browseSafeApps}
      />
    )
  }

  return <WcProposalForm proposal={proposal} onApprove={onApprove} onReject={onReject} />
}

export default WcProposalStep
