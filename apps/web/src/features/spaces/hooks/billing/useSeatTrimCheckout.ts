import { useCallback } from 'react'
import type { SafeRef } from '../../components/Plans/types'
import { useSeatTrim } from './useSeatTrim'
import { useStartCheckout } from './useStartCheckout'

/**
 * Checkout for a seat-limited offer: `needsTrim` tells whether the accounts step is shown (the Workspace holds more
 * Safes than the plan covers), `checkout` removes the Safes left out (they stay in My accounts) and then goes to Stripe.
 */
export const useSeatTrimCheckout = (spaceId: string, returnPathname?: string) => {
  const { safeCount, needsTrim, trim, isTrimming, error: trimError } = useSeatTrim(spaceId)
  const { startCheckout, isRedirecting, isError: isCheckoutError } = useStartCheckout(spaceId, returnPathname)

  const checkout = useCallback(
    async (paymentLinkId: string, removed: SafeRef[] = []): Promise<boolean> => {
      if (removed.length > 0 && !(await trim(removed))) return false
      await startCheckout(paymentLinkId)
      return true
    },
    [trim, startCheckout],
  )

  const error = trimError ?? (isCheckoutError ? 'We couldn’t start the checkout. Please try again.' : undefined)

  return { safeCount, needsTrim, checkout, isBusy: isRedirecting || isTrimming, error }
}
