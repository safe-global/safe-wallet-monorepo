import { useEffect, useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/router'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  useBillingGetCheckoutSessionV1Query,
  useBillingGetSubscriptionsV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { CHECKOUT_SESSION_QUERY_PARAM } from './returnUrl'
import { getPlanStatus, selectCurrentSubscription } from './subscription'
import { useBillingSpaceId } from './useBillingSpaceId'

const POLL_INTERVAL = 3_000
const POLL_TIMEOUT = 60_000

// A $0 trial checkout settles as `no_payment_required`; a paid one as `paid`.
const SETTLED_PAYMENT_STATUSES = new Set(['paid', 'no_payment_required'])

export type CheckoutReturnStatus = 'idle' | 'processing' | 'activating' | 'complete' | 'timeout' | 'error'

// Every mounted instance reads the same deadline per session, so the lock and checkout modals time out and retry together.
const deadlines = new Map<string, number>()
const listeners = new Set<() => void>()

const subscribeDeadlines = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const setDeadline = (sessionId: string, deadline: number) => {
  deadlines.set(sessionId, deadline)
  listeners.forEach((listener) => listener())
}

export const _resetCheckoutDeadlines = () => deadlines.clear()

/** Polls the checkout session until it settles, then the subscriptions until the billing webhook propagates it. */
export const useCheckoutReturn = (spaceId?: string | null) => {
  const router = useRouter()
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const rawSessionId = router.query[CHECKOUT_SESSION_QUERY_PARAM]
  const sessionId = gatedSpaceId && typeof rawSessionId === 'string' && rawSessionId ? rawSessionId : null
  const isReturning = sessionId !== null

  const deadline = useSyncExternalStore(
    subscribeDeadlines,
    () => (sessionId ? deadlines.get(sessionId) : undefined),
    () => undefined,
  )
  const [now, setNow] = useState(Date.now)
  const timedOut = deadline !== undefined && now >= deadline

  const [isSessionDone, setIsSessionDone] = useState(false)
  const [isSubscriptionDone, setIsSubscriptionDone] = useState(false)

  const { data: session, isError: isSessionError } = useBillingGetCheckoutSessionV1Query(
    sessionId ? { sessionId } : skipToken,
    { pollingInterval: isSessionDone || timedOut ? 0 : POLL_INTERVAL },
  )
  const isSettled = session !== undefined && SETTLED_PAYMENT_STATUSES.has(session.paymentStatus)

  const { data: subscriptions } = useBillingGetSubscriptionsV1Query(
    isSettled && gatedSpaceId ? { spaceId: gatedSpaceId } : skipToken,
    { pollingInterval: isSubscriptionDone || timedOut ? 0 : POLL_INTERVAL },
  )
  const subscription = selectCurrentSubscription(subscriptions)
  const planStatus = getPlanStatus(subscription)
  const isComplete = planStatus === 'trialing' || planStatus === 'active'

  useEffect(() => setIsSessionDone(isSettled || isSessionError), [isSettled, isSessionError])
  useEffect(() => setIsSubscriptionDone(isComplete), [isComplete])

  useEffect(() => {
    if (sessionId && !isComplete && !deadlines.has(sessionId)) setDeadline(sessionId, Date.now() + POLL_TIMEOUT)
  }, [sessionId, isComplete])

  useEffect(() => {
    if (deadline === undefined || isComplete) return
    const id = setTimeout(() => setNow(Date.now()), Math.max(deadline - Date.now(), 0))
    return () => clearTimeout(id)
  }, [deadline, isComplete])

  const retry = () => {
    if (sessionId) setDeadline(sessionId, Date.now() + POLL_TIMEOUT)
  }

  const dismiss = () => {
    const { [CHECKOUT_SESSION_QUERY_PARAM]: _sessionId, ...query } = router.query
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }

  const status: CheckoutReturnStatus = !isReturning
    ? 'idle'
    : isSessionError
      ? 'error'
      : isComplete
        ? 'complete'
        : timedOut
          ? 'timeout'
          : isSettled
            ? 'activating'
            : 'processing'

  return { isReturning, status, subscription, dismiss, retry }
}
