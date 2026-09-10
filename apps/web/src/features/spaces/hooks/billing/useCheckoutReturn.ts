import { useEffect, useRef, useState } from 'react'
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

/**
 * Drives the return from Stripe Checkout: while the URL carries a session id it polls the session until it
 * settles, then the subscriptions until the new one propagates through the billing webhook (or times out).
 */
export const useCheckoutReturn = (spaceId?: string | null) => {
  const router = useRouter()
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const rawSessionId = router.query[CHECKOUT_SESSION_QUERY_PARAM]
  const sessionId = typeof rawSessionId === 'string' && rawSessionId ? rawSessionId : null
  const isReturning = sessionId !== null
  const [timedOut, setTimedOut] = useState(false)
  const startedAt = useRef<number | null>(null)

  const { data: session, isError: isSessionError } = useBillingGetCheckoutSessionV1Query(
    sessionId ? { sessionId } : skipToken,
    { pollingInterval: POLL_INTERVAL },
  )
  const isSettled = session !== undefined && SETTLED_PAYMENT_STATUSES.has(session.paymentStatus)

  const { data: subscriptions } = useBillingGetSubscriptionsV1Query(
    isSettled && gatedSpaceId ? { spaceId: gatedSpaceId } : skipToken,
    { pollingInterval: POLL_INTERVAL },
  )
  const subscription = selectCurrentSubscription(subscriptions)
  const planStatus = getPlanStatus(subscription)
  const isComplete = planStatus === 'trialing' || planStatus === 'active'

  useEffect(() => {
    if (!isReturning || isComplete) {
      startedAt.current = null
      setTimedOut(false)
      return
    }
    startedAt.current ??= Date.now()
    const remaining = POLL_TIMEOUT - (Date.now() - startedAt.current)
    const id = setTimeout(() => setTimedOut(true), Math.max(remaining, 0))
    return () => clearTimeout(id)
  }, [isReturning, isComplete])

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

  return { isReturning, status, subscription, dismiss }
}
