import { useState } from 'react'
import { useLazyBillingGetCheckoutUrlV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { useCurrentSpaceId } from '@/features/spaces'
import { getBillingReturnUrl } from './returnUrl'

interface CheckoutResult {
  startCheckout: (paymentLinkId: string) => Promise<void>
  isRedirecting: boolean
  error: boolean
}

/**
 * Starts a checkout for a payment link: requests the Stripe checkout URL and
 * redirects the browser to it. On return, the Billing page reads `?sessionId=`.
 */
export const useCheckout = (): CheckoutResult => {
  const spaceId = useCurrentSpaceId()
  const [trigger, { isFetching }] = useLazyBillingGetCheckoutUrlV1Query()
  const [error, setError] = useState(false)

  const startCheckout = async (paymentLinkId: string) => {
    if (!spaceId) return
    setError(false)
    try {
      const { url } = await trigger({ spaceId, paymentLinkId, returnUrl: getBillingReturnUrl(spaceId, true) }).unwrap()
      window.location.href = url
    } catch {
      setError(true)
    }
  }

  return { startCheckout, isRedirecting: isFetching, error }
}
