import { useCallback, useContext, useEffect } from 'react'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import useSafeInfo from '@/hooks/useSafeInfo'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS, WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { WalletConnectContext, WalletConnectProvider } from '../WalletConnectContext'
import useWcUri from '../../hooks/useWcUri'
import WcHeaderWidget from '../WcHeaderWidget'
import WcSessionManager from '../WcSessionManager'
import { useSafeAppSuggestionDismissed } from '../../hooks/useSafeAppSuggestion'

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
    showSuggestion,
    loading,
    dontShowAgain,
  } = useContext(WalletConnectContext)
  const [uri, clearUri] = useWcUri()
  const { safeLoaded } = useSafeInfo()
  const [, setSuggestionDismissed] = useSafeAppSuggestionDismissed()

  const onOpen = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  // Closing the popup on a pending proposal means "no", so reject it rather than leaving
  // the dApp waiting for a response that never comes
  const onClose = useCallback(() => {
    setOpen(false)

    // An approve or reject is already in flight; rejecting again would cancel the very
    // session being approved
    if (!sessionProposal || loading) return

    const origin = sessionProposal.verifyContext.verified.origin

    if (matchingSafeApp && showSuggestion) {
      trackEvent(
        { ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT, label: origin },
        {
          [MixpanelEventParams.APP_URL]: origin,
          [MixpanelEventParams.SAFE_APP_NAME]: matchingSafeApp.name,
          [MixpanelEventParams.RESULT]: WcSafeAppSuggestionResult.DISMISSED,
          [MixpanelEventParams.SUGGESTION_DISMISSED]: dontShowAgain,
        },
      )
      if (dontShowAgain) setSuggestionDismissed(true)
    }

    trackEvent({ ...WALLETCONNECT_EVENTS.REJECT_CLICK, label: origin })

    // Best effort: the popup is already closed, so an error here has nowhere to surface
    rejectSession().catch(() => {})
  }, [
    setOpen,
    sessionProposal,
    loading,
    rejectSession,
    matchingSafeApp,
    showSuggestion,
    dontShowAgain,
    setSuggestionDismissed,
  ])

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
