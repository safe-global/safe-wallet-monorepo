import { useCallback, useContext, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { Spinner } from '@/components/ui/spinner'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { WalletConnectContext } from '../WalletConnectContext'
import WcConnectionForm from '../WcConnectionForm'
import WcErrorMessage from '../WcErrorMessage'
import { trackEvent, trackSafeAppEvent } from '@/services/analytics'
import { SAFE_APPS_EVENTS } from '@/services/analytics/events/safeApps'
import { WALLETCONNECT_EVENTS, WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { MixpanelEventParams, SafeAppLaunchLocation } from '@/services/analytics/mixpanel-events'
import { getSafeAppUrl } from '@/components/safe-apps/SafeAppCard'
import { AppRoutes } from '@/config/routes'
import { splitError } from '../../services/utils'
import WcProposalForm from '../WcProposalForm'
import WcSafeAppSuggestion from '../WcSafeAppSuggestion'
import WcChainSwitchModal from '../WcChainSwitchModal'
import { wcChainSwitchStore } from '../../store/wcChainSwitchSlice'
import { useSafeAppSuggestionDismissed } from '../../hooks/useSafeAppSuggestion'

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
    matchingSafeApp,
    isMatchingSafeAppLoading,
    showSuggestion,
    isSuggestionResolved,
    setSuggestionResolved,
    dontShowAgain,
  } = useContext(WalletConnectContext)
  const chainSwitchRequest = wcChainSwitchStore.useStore()
  const router = useRouter()

  const [, setSuggestionDismissed] = useSafeAppSuggestionDismissed()

  // The verified origin, not proposer.metadata.url, which the dApp declares about itself and
  // could use to attribute its traffic to another domain
  const proposalUrl = sessionProposal?.verifyContext.verified.origin ?? ''

  // Records which path the user took when a Safe App was suggested
  const trackSuggestionResult = useCallback(
    (result: WcSafeAppSuggestionResult, dontShowAgain: boolean) => {
      if (!matchingSafeApp) return

      trackEvent(
        { ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTION_RESULT, label: proposalUrl },
        {
          [MixpanelEventParams.APP_URL]: proposalUrl,
          [MixpanelEventParams.SAFE_APP_NAME]: matchingSafeApp.name,
          [MixpanelEventParams.RESULT]: result,
          [MixpanelEventParams.SUGGESTION_DISMISSED]: dontShowAgain,
        },
      )
    },
    [matchingSafeApp, proposalUrl],
  )

  // Keyed on the proposal so a refetch of the Safe Apps list cannot log a second impression
  // and inflate the funnel
  const trackedImpressionRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!showSuggestion || !sessionProposal || !matchingSafeApp) return
    if (trackedImpressionRef.current === sessionProposal.id) return

    trackedImpressionRef.current = sessionProposal.id

    trackEvent(
      { ...WALLETCONNECT_EVENTS.SAFE_APP_SUGGESTED, label: proposalUrl },
      {
        [MixpanelEventParams.APP_URL]: proposalUrl,
        [MixpanelEventParams.SAFE_APP_NAME]: matchingSafeApp.name,
      },
    )
  }, [showSuggestion, sessionProposal, matchingSafeApp, proposalUrl])

  useEffect(() => {
    if (!open && chainSwitchRequest) {
      chainSwitchRequest.onCancel()
    }
  }, [open, chainSwitchRequest])

  // On session approve
  const onApprove = useCallback(async () => {
    if (!sessionProposal) return

    trackEvent({ ...WALLETCONNECT_EVENTS.APPROVE_CLICK, label: proposalUrl })

    try {
      await approveSession()
    } catch (e) {
      setError(e as Error)
      return
    }

    // Keyed on the verified origin, like the suggestion events, so the funnel can be joined
    trackEvent(
      { ...WALLETCONNECT_EVENTS.CONNECTED, label: proposalUrl },
      {
        [MixpanelEventParams.APP_URL]: proposalUrl,
        [MixpanelEventParams.SAFE_APP_AVAILABLE]: Boolean(matchingSafeApp),
      },
    )
  }, [sessionProposal, approveSession, setError, matchingSafeApp, proposalUrl])

  // On session reject
  const onReject = useCallback(async () => {
    if (!sessionProposal) return

    trackEvent({ ...WALLETCONNECT_EVENTS.REJECT_CLICK, label: proposalUrl })

    try {
      await rejectSession()
    } catch (e) {
      setError(e as Error)
    }
  }, [sessionProposal, rejectSession, setError, proposalUrl])

  // Connect over WalletConnect straight from the suggestion
  const onContinueWithWalletConnect = useCallback(async () => {
    await onApprove()

    // Persisted and resolved only after the approval settles: flipping `dismissed` first would
    // swap the connection form in for the whole round-trip
    if (dontShowAgain) setSuggestionDismissed(true)
    setSuggestionResolved(true)
    trackSuggestionResult(WcSafeAppSuggestionResult.CONTINUED_WITH_WALLETCONNECT, dontShowAgain)
  }, [onApprove, dontShowAgain, setSuggestionDismissed, setSuggestionResolved, trackSuggestionResult])

  // On opening the suggested Safe App instead of connecting over WalletConnect.
  // The proposal is rejected rather than left pending so the dApp gets a clean response.
  const onOpenSafeApp = useCallback(
    async (safeApp: SafeAppData) => {
      if (!sessionProposal) return

      trackSuggestionResult(WcSafeAppSuggestionResult.OPENED_SAFE_APP, dontShowAgain)
      if (dontShowAgain) setSuggestionDismissed(true)
      setSuggestionResolved(true)

      trackSafeAppEvent({ ...SAFE_APPS_EVENTS.OPEN_APP, label: safeApp.name }, safeApp, {
        launchLocation: SafeAppLaunchLocation.WC_PROPOSAL,
      })

      // Rejecting is best-effort cleanup for the dApp. If it fails, e.g. because the
      // proposal already expired, the user still asked to open the Safe App
      try {
        await rejectSession()
      } catch {
        // Intentionally ignored: navigation is the user's intent, not the rejection
      }

      setOpen(false)
      router.push(getSafeAppUrl(router, safeApp.url)).catch(() => {})
    },
    [
      sessionProposal,
      rejectSession,
      router,
      setOpen,
      dontShowAgain,
      trackSuggestionResult,
      setSuggestionDismissed,
      setSuggestionResolved,
    ],
  )

  // Browsing the store declines both options, so the proposal is rejected rather than left
  // pending while the user navigates away
  const onBrowseSafeApps = useCallback(async () => {
    trackSuggestionResult(WcSafeAppSuggestionResult.BROWSED_STORE, dontShowAgain)
    if (dontShowAgain) setSuggestionDismissed(true)
    setSuggestionResolved(true)

    try {
      await rejectSession()
    } catch {
      // Intentionally ignored: navigation is the user's intent, not the rejection
    }

    setOpen(false)
    router.push({ pathname: AppRoutes.apps.index, query: { safe: router.query.safe } }).catch(() => {})
  }, [
    trackSuggestionResult,
    dontShowAgain,
    setSuggestionDismissed,
    setSuggestionResolved,
    rejectSession,
    router,
    setOpen,
  ])

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

  // Without this the connection form renders, and can be approved, in the moment before the
  // suggestion replaces it
  if (sessionProposal && isMatchingSafeAppLoading && !isSuggestionResolved) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    )
  }

  // Suggest the Safe App before the connection form
  if (showSuggestion && matchingSafeApp) {
    return (
      <WcSafeAppSuggestion
        safeApp={matchingSafeApp}
        origin={proposalUrl}
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
