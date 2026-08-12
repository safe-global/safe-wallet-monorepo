import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  useBillingGetCheckoutSessionV1Query,
  useBillingGetSubscriptionsV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { useCurrentSpaceId } from '@/features/spaces'
import { selectActiveSubscription } from './subscriptionState'

const POLL_INTERVAL = 3000
const POLL_TIMEOUT = 60_000

export type CheckoutReturnStatus = 'idle' | 'processing' | 'activating' | 'complete' | 'timeout' | 'error'

interface CheckoutReturnResult {
  /** Whether we are returning from a Stripe checkout (a sessionId is present). */
  isReturning: boolean
  status: CheckoutReturnStatus
  /** Clears the `sessionId` from the URL once the flow settles. */
  dismiss: () => void
}

/**
 * Drives the return-from-Stripe activation flow. When the URL carries a
 * `sessionId`, it polls the checkout session until the payment is confirmed,
 * then polls the space subscriptions until the new one propagates (or times out
 * after 60s). The Billing page renders an `activating` state meanwhile.
 */
export const useCheckoutReturn = (): CheckoutReturnResult => {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  const sessionId = typeof router.query.sessionId === 'string' ? router.query.sessionId : undefined
  const isReturning = !!sessionId

  const [timedOut, setTimedOut] = useState(false)
  const startedAt = useRef<number | null>(null)

  // 1) Poll the checkout session until it's paid.
  const { data: session, isError: sessionError } = useBillingGetCheckoutSessionV1Query(
    sessionId ? { sessionId } : skipToken,
    { pollingInterval: POLL_INTERVAL },
  )
  const isPaid = session?.paymentStatus === 'paid'

  // 2) Once paid, poll subscriptions until the active one appears.
  const { data: subscriptions } = useBillingGetSubscriptionsV1Query(
    isReturning && isPaid && spaceId ? { spaceId } : skipToken,
    { pollingInterval: POLL_INTERVAL },
  )
  const hasSubscription = !!selectActiveSubscription(subscriptions)

  // Timeout guard: stop waiting for propagation after POLL_TIMEOUT.
  useEffect(() => {
    if (!isReturning || hasSubscription) {
      startedAt.current = null
      setTimedOut(false)
      return
    }
    if (startedAt.current === null) startedAt.current = Date.now()
    const remaining = POLL_TIMEOUT - (Date.now() - startedAt.current)
    const id = setTimeout(() => setTimedOut(true), Math.max(remaining, 0))
    return () => clearTimeout(id)
  }, [isReturning, hasSubscription])

  const dismiss = () => {
    const { sessionId: _sessionId, ...rest } = router.query
    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true })
  }

  const status: CheckoutReturnStatus = !isReturning
    ? 'idle'
    : sessionError
      ? 'error'
      : hasSubscription
        ? 'complete'
        : timedOut
          ? 'timeout'
          : isPaid
            ? 'activating'
            : 'processing'

  return { isReturning, status, dismiss }
}
