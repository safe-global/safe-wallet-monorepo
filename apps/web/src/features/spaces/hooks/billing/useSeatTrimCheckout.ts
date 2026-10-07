import { useCallback } from 'react'
import type { SafeRef } from '../../components/Plans/types'
import { useSeatTrim } from './useSeatTrim'
import { useStartCheckout, type CheckoutProps } from './useStartCheckout'

export const useSeatTrimCheckout = (spaceId: string, returnPathname?: string) => {
  const { seatCount, needsTrim, trim, isTrimming, error: trimError } = useSeatTrim(spaceId)
  const { startCheckout, isRedirecting, isError: isCheckoutError } = useStartCheckout(spaceId, returnPathname)

  const checkout = useCallback(
    async (paymentLinkId: string, props: CheckoutProps, removed: SafeRef[] = []): Promise<boolean> => {
      if (removed.length > 0 && !(await trim(removed))) return false
      await startCheckout(paymentLinkId, props)
      return true
    },
    [trim, startCheckout],
  )

  const error = trimError ?? (isCheckoutError ? 'We couldn’t start the checkout. Please try again.' : undefined)

  return { seatCount, needsTrim, checkout, isBusy: isRedirecting || isTrimming, error }
}
