import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { skipToken } from '@reduxjs/toolkit/query'
import { useBillingGetCheckoutSessionV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { useSpacesGetSetupV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import SetupProgress from '@safe-global/views/features/spaces/components/WorkspaceWizard/SetupProgress'
import { AppRoutes } from '@/config/routes'
import { useAppDispatch } from '@/store'
import { clearWorkspaceDraft } from '@/features/spaces/store'
import { CHECKOUT_SESSION_QUERY_PARAM } from '../../hooks/billing/returnUrl'

const POLL_INTERVAL = 2_500
const SETUP_TIMEOUT = 60_000

/**
 * Back from Stripe on the last step. A completed checkout waits until the CGW has added the Safes and sent the
 * invites, then opens the Workspace; a cancelled one drops the session and shows the form again.
 */
const CheckoutReturnScreen = ({ sessionId, spaceId }: { sessionId: string; spaceId: string | null }): ReactElement => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { data: session, isError: isSessionError, refetch } = useBillingGetCheckoutSessionV1Query({ sessionId })
  const isComplete = session?.status === 'complete'
  const isCancelled = session !== undefined && !isComplete

  const [isSlow, setIsSlow] = useState(false)
  const hasOpened = useRef(false)
  // Once applied the screen opens the Workspace and unmounts, which ends the polling.
  const { data: setup } = useSpacesGetSetupV1Query(isComplete && spaceId ? { id: spaceId } : skipToken, {
    pollingInterval: isSlow ? 0 : POLL_INTERVAL,
  })
  const isApplied = setup?.status === 'applied'

  const openWorkspace = useCallback(() => {
    dispatch(clearWorkspaceDraft())
    void router.replace({
      pathname: AppRoutes.spaces.index,
      query: { spaceId, [CHECKOUT_SESSION_QUERY_PARAM]: sessionId },
    })
  }, [dispatch, router, spaceId, sessionId])

  useEffect(() => {
    if (!isComplete) return
    const timer = setTimeout(() => setIsSlow(true), SETUP_TIMEOUT)
    return () => clearTimeout(timer)
  }, [isComplete])

  useEffect(() => {
    if (!isApplied || hasOpened.current) return
    hasOpened.current = true
    openWorkspace()
  }, [isApplied, openWorkspace])

  useEffect(() => {
    if (!isCancelled) return
    const { [CHECKOUT_SESSION_QUERY_PARAM]: _dropped, ...query } = router.query
    void router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }, [isCancelled, router])

  if (!spaceId) {
    return (
      <SetupProgress
        isWorking={false}
        title="We couldn't find your new Workspace"
        body="Open your Workspaces to continue."
        actionLabel="Go to Workspaces"
        onAction={() => void router.replace(AppRoutes.welcome.spaces)}
      />
    )
  }

  if (isSessionError) {
    return (
      <SetupProgress
        isWorking={false}
        title="We couldn't confirm your checkout"
        body="Check your connection and try again."
        actionLabel="Try again"
        onAction={() => void refetch()}
      />
    )
  }

  if (isSlow) {
    return (
      <SetupProgress
        isWorking={false}
        title="Your trial started"
        body="We are still adding your Safe accounts and sending your invites. They will show up in your Workspace in a moment."
        actionLabel="Go to Workspace"
        onAction={openWorkspace}
      />
    )
  }

  return <SetupProgress isWorking title="Setting up your Workspace" body="This usually takes a few seconds." />
}

export default CheckoutReturnScreen
