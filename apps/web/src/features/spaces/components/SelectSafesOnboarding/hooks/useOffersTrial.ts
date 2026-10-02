import { useRouter } from 'next/router'
import { useWorkspaceLock } from '../../../hooks/useWorkspaceLock'
import { CHECKOUT_SESSION_QUERY_PARAM } from '../../../hooks/billing/returnUrl'

/** A Workspace that comes back here without a plan, after a cancelled step-up or Stripe's Back link, is offered its trial again. */
const useOffersTrial = (spaceId: string | undefined): boolean => {
  const router = useRouter()
  const lock = useWorkspaceLock(spaceId ?? null)
  // While a checkout return is being confirmed the subscription may not exist yet, so the lock still reads as offered.
  const isConfirmingCheckout = Boolean(router.query[CHECKOUT_SESSION_QUERY_PARAM])

  return Boolean(spaceId) && lock.isLocked && lock.reason === 'trial-offered' && !isConfirmingCheckout
}

export default useOffersTrial
