import { useCallback, useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import type { UrlObject } from 'url'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { WalletConnectContext } from '../WalletConnectContext'
import WcConnectionForm from '../WcConnectionForm'
import WcErrorMessage from '../WcErrorMessage'
import { trackEvent, trackSafeAppEvent } from '@/services/analytics'
import { SAFE_APPS_EVENTS } from '@/services/analytics/events/safeApps'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams, SafeAppLaunchLocation } from '@/services/analytics/mixpanel-events'
import { getSafeAppUrl } from '@/components/safe-apps/SafeAppCard'
import { AppRoutes } from '@/config/routes'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { Errors, logError } from '@/services/exceptions'
import { splitError } from '../../services/utils'
import WcProposalForm from '../WcProposalForm'
import WcSafeAppSuggestion from '../WcSafeAppSuggestion'
import WcChainSwitchModal from '../WcChainSwitchModal'
import { wcChainSwitchStore } from '../../store/wcChainSwitchSlice'

type WcSessionManagerProps = {
  uri: string
}

const WcSessionManager = ({ uri }: WcSessionManagerProps) => {
  const {
    sessions,
    sessionProposal,
    error,
    setError,
    open,
    setOpen,
    approveSession,
    rejectSession,
    safeAppSuggestion,
  } = useContext(WalletConnectContext)
  const chainSwitchRequest = wcChainSwitchStore.useStore()
  const router = useRouter()
  const safeLinkQuery = useSafeLinkQuery()
  const {
    status: suggestionStatus,
    safeApp: suggestedSafeApp,
    resolve: resolveSuggestion,
    decline: declineSuggestion,
  } = safeAppSuggestion

  useEffect(() => {
    if (!open && chainSwitchRequest) {
      chainSwitchRequest.onCancel()
    }
  }, [open, chainSwitchRequest])

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

    trackEvent(
      { ...WALLETCONNECT_EVENTS.CONNECTED, label },
      {
        [MixpanelEventParams.APP_URL]: sessionProposal.params.proposer.metadata.url,
        ...(suggestionStatus !== 'off' && { [MixpanelEventParams.SAFE_APP_AVAILABLE]: Boolean(suggestedSafeApp) }),
      },
    )
  }, [sessionProposal, approveSession, setError, suggestionStatus, suggestedSafeApp])

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

  const onContinueWithWalletConnect = useCallback(async () => {
    await onApprove()
    declineSuggestion()
  }, [onApprove, declineSuggestion])

  // The proposal is rejected so the dApp gets an answer instead of waiting while the user leaves
  const leaveForSafeApps = useCallback(
    async (url: UrlObject | string) => {
      try {
        await rejectSession()
      } catch (e) {
        setError(asError(e))
      }
      resolveSuggestion()
      setOpen(false)
      await router.push(url)
    },
    [rejectSession, setError, resolveSuggestion, setOpen, router],
  )

  const onOpenSafeApp = useCallback(
    (safeApp: SafeAppData) => {
      leaveForSafeApps(getSafeAppUrl(router, safeLinkQuery, safeApp.url))
        .then(() => {
          trackSafeAppEvent({ ...SAFE_APPS_EVENTS.OPEN_APP, label: safeApp.name }, safeApp, {
            launchLocation: SafeAppLaunchLocation.WC_PROPOSAL,
          })
        })
        .catch((e) => logError(Errors._900, asError(e).message))
    },
    [leaveForSafeApps, router, safeLinkQuery],
  )

  const onBrowseSafeApps = useCallback(() => {
    leaveForSafeApps({ pathname: AppRoutes.apps.index, query: safeLinkQuery }).catch((e) =>
      logError(Errors._902, asError(e).message),
    )
  }, [leaveForSafeApps, safeLinkQuery])

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
  if (!open && !chainSwitchRequest) return null

  if (chainSwitchRequest) {
    return (
      <WcChainSwitchModal
        appInfo={chainSwitchRequest.appInfo}
        chain={chainSwitchRequest.chain}
        safes={chainSwitchRequest.safes}
        onSelectSafe={chainSwitchRequest.onSelectSafe}
        onCancel={chainSwitchRequest.onCancel}
      />
    )
  }

  // Error
  if (error) {
    return <WcErrorMessage error={error} onClose={onErrorReset} />
  }

  // The connection form must not be approvable in the moment before the suggestion replaces it
  if (suggestionStatus === 'loading') {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  if (sessionProposal && suggestionStatus === 'shown' && suggestedSafeApp) {
    return (
      <WcSafeAppSuggestion
        safeApp={suggestedSafeApp}
        origin={sessionProposal.verifyContext.verified.origin}
        onOpenSafeApp={onOpenSafeApp}
        onContinueWithWalletConnect={onContinueWithWalletConnect}
        onBrowseSafeApps={onBrowseSafeApps}
      />
    )
  }

  // Session proposal
  if (sessionProposal) {
    return <WcProposalForm proposal={sessionProposal} onApprove={onApprove} onReject={onReject} />
  }

  // Connection form (initial state)
  return <WcConnectionForm sessions={sessions} uri={uri} />
}

export default WcSessionManager
