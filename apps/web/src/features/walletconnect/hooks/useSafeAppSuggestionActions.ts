import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import type { UrlObject } from 'url'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { getSafeAppUrl } from '@/components/safe-apps/SafeAppCard'
import { AppRoutes } from '@/config/routes'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { trackEvent, trackSafeAppEvent } from '@/services/analytics'
import { SAFE_APPS_EVENTS } from '@/services/analytics/events/safeApps'
import { WcSafeAppSuggestionResult } from '@/services/analytics/events/walletconnect'
import { SafeAppLaunchLocation } from '@/services/analytics/mixpanel-events'
import { Errors, logError } from '@/services/exceptions'
import { WalletConnectContext } from '../components/WalletConnectContext'
import { getSuggestionResultEvent } from '../services/tracking'

/**
 * The actions of the Safe App suggestion, and the automatic redirect for a dApp remembered as Safe App.
 * `onApprove` resolves to whether the session was approved.
 */
export const useSafeAppSuggestionActions = (onApprove: () => Promise<boolean>) => {
  const { sessionProposal, rejectSession, setError, setOpen, safeAppSuggestion } = useContext(WalletConnectContext)
  const { status, safeApp: suggestedSafeApp, remember, rememberChoice } = safeAppSuggestion
  const router = useRouter()
  const safeLinkQuery = useSafeLinkQuery()
  const [isLeaving, setIsLeaving] = useState(false)
  // Each proposal is left at most once, whether the user or the redirect started it
  const leftProposalId = useRef<number>(undefined)
  const proposalId = sessionProposal?.id
  const origin = sessionProposal?.verifyContext.verified.origin

  // The proposal is rejected so the dApp gets an answer instead of waiting while the user leaves
  const leaveFor = useCallback(
    async (url: UrlObject | string): Promise<boolean> => {
      leftProposalId.current = proposalId
      setIsLeaving(true)
      try {
        await rejectSession()
      } catch (e) {
        setError(asError(e))
      }
      setOpen(false)
      try {
        return await router.push(url)
      } finally {
        setIsLeaving(false)
      }
    },
    [proposalId, rejectSession, setError, setOpen, router],
  )

  const openSafeApp = useCallback(
    (safeApp: SafeAppData) => {
      if (remember && origin) rememberChoice(origin, 'safeApp')
      leaveFor(getSafeAppUrl(router, safeLinkQuery, safeApp.url))
        .then((navigated) => {
          if (!navigated) return
          trackSafeAppEvent({ ...SAFE_APPS_EVENTS.OPEN_APP, label: safeApp.name }, safeApp, {
            launchLocation: SafeAppLaunchLocation.WC_PROPOSAL,
          })
        })
        .catch((e) => logError(Errors._900, asError(e).message))
    },
    [remember, origin, rememberChoice, leaveFor, router, safeLinkQuery],
  )

  const browseSafeApps = useCallback(() => {
    leaveFor({ pathname: AppRoutes.apps.index, query: safeLinkQuery }).catch((e) =>
      logError(Errors._902, asError(e).message),
    )
  }, [leaveFor, safeLinkQuery])

  const continueWithWalletConnect = useCallback(async () => {
    // Read before approving: a successful approval clears the proposal
    const choiceOrigin = origin
    const shouldRemember = remember
    const isApproved = await onApprove()
    if (isApproved && shouldRemember && choiceOrigin) rememberChoice(choiceOrigin, 'walletConnect')
  }, [origin, remember, onApprove, rememberChoice])

  useEffect(() => {
    if (status !== 'redirect' || !suggestedSafeApp || !origin) return
    if (leftProposalId.current === proposalId) return
    const { event, params } = getSuggestionResultEvent(origin, suggestedSafeApp, {
      result: WcSafeAppSuggestionResult.OPENED_REMEMBERED_SAFE_APP,
      remember: true,
    })
    trackEvent(event, params)
    openSafeApp(suggestedSafeApp)
  }, [status, suggestedSafeApp, origin, proposalId, openSafeApp])

  return { isLeaving, openSafeApp, browseSafeApps, continueWithWalletConnect }
}
