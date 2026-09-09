import { useCallback, useContext, useEffect } from 'react'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import useSafeInfo from '@/hooks/useSafeInfo'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS, WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { WalletConnectContext, WalletConnectProvider } from '../WalletConnectContext'
import useWcUri from '../../hooks/useWcUri'
import { useIsSafeAppSuggested } from '../../hooks/useSafeAppSuggestion'
import WcHeaderWidget from '../WcHeaderWidget'
import WcSessionManager from '../WcSessionManager'

const WalletConnectWidget = () => {
  const {
    walletConnect,
    error,
    open,
    setOpen,
    sessions,
    sessionProposal,
    rejectSession,
    matchingSafeApp,
    isSuggestionResolved,
  } = useContext(WalletConnectContext)
  const [uri, clearUri] = useWcUri()
  const { safeLoaded } = useSafeInfo()
  const isSafeAppSuggested = useIsSafeAppSuggested(sessionProposal, matchingSafeApp)

  const onOpen = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  // Closing the popup on a pending proposal means "no", so reject it rather than leaving
  // the dApp waiting for a response that never comes
  const onClose = useCallback(() => {
    setOpen(false)

    if (!sessionProposal) return

    const label = sessionProposal.params.proposer.metadata.url
    // Suggestion events are keyed on the verified origin, matching what the Safe App was
    // matched against, rather than the URL the dApp declares about itself
    const origin = sessionProposal.verifyContext.verified.origin

    if (matchingSafeApp && isSafeAppSuggested && !isSuggestionResolved) {
      trackEvent(
        { ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT, label: origin },
        {
          [MixpanelEventParams.APP_URL]: origin,
          [MixpanelEventParams.SAFE_APP_NAME]: matchingSafeApp.name,
          [MixpanelEventParams.RESULT]: WcSafeAppSuggestionResult.DISMISSED,
          [MixpanelEventParams.SUGGESTION_DISMISSED]: false,
        },
      )
    }

    trackEvent({ ...WALLETCONNECT_EVENTS.REJECT_CLICK, label })

    // Best effort: the popup is already closed, so an error here has nowhere to surface
    rejectSession().catch(() => {})
  }, [setOpen, sessionProposal, rejectSession, matchingSafeApp, isSafeAppSuggested, isSuggestionResolved])

  // Open the popup if there is a pairing code in the URL or clipboard
  useEffect(() => {
    if (safeLoaded && uri) {
      onOpen()
    }
  }, [safeLoaded, uri, onOpen])

  // Clear the pairing code when connected
  useEffect(() => {
    return walletConnect?.onSessionPropose(clearUri)
  }, [walletConnect, clearUri])

  return (
    <WcHeaderWidget isError={!!error} isOpen={open} onOpen={onOpen} onClose={onClose} sessions={sessions}>
      <WcSessionManager uri={uri} />
    </WcHeaderWidget>
  )
}

const WalletConnectUi = () => (
  <ObservabilityErrorBoundary>
    <WalletConnectProvider>
      <WalletConnectWidget />
    </WalletConnectProvider>
  </ObservabilityErrorBoundary>
)

export default WalletConnectUi
