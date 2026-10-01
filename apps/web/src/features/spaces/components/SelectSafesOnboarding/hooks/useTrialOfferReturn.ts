import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import { sanitizeNextUrl } from '@/utils/nextUrl'
import { CREATED_SPACE_QUERY_PARAM } from '@/features/spaces/constants'
import { useWorkspaceLock } from '../../../hooks/useWorkspaceLock'
import { CHECKOUT_SESSION_QUERY_PARAM } from '../../../hooks/billing/returnUrl'

/**
 * Stripe's Back link returns to this step with the Workspace still waiting on its trial, which has
 * no Safe slots yet. The user is sent back to the trial offer instead of a "0 of 0" Safes list.
 */
const useTrialOfferReturn = (spaceId: string | undefined) => {
  const router = useRouter()
  const safe = useSafeQueryParam() || undefined
  const lock = useWorkspaceLock(spaceId ?? null)
  const offersTrial = lock.isLocked && lock.reason === 'trial-offered'
  // While a checkout return is being confirmed the subscription may not exist yet, so the lock still reads as offered.
  const isConfirmingCheckout = Boolean(router.query[CHECKOUT_SESSION_QUERY_PARAM])

  useEffect(() => {
    if (!spaceId || !offersTrial || isConfirmingCheckout) return

    const next = sanitizeNextUrl(router.query.next)
    router.replace({
      pathname: AppRoutes.welcome.createSpace,
      query: { [CREATED_SPACE_QUERY_PARAM]: spaceId, ...(safe ? { safe } : {}), ...(next ? { next } : {}) },
    })
  }, [spaceId, offersTrial, isConfirmingCheckout, safe, router])
}

export default useTrialOfferReturn
