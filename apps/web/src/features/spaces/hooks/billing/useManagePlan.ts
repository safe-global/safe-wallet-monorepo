import { useState } from 'react'
import { useLazyBillingGetSessionUrlV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { useCurrentSpaceId } from '@/features/spaces'
import { getBillingReturnUrl } from './returnUrl'

interface ManagePlanResult {
  openPortal: () => Promise<void>
  isRedirecting: boolean
  error: boolean
}

/**
 * Opens the Stripe Customer Portal (manage payment method, invoices, cancel).
 * Requests the session URL on demand and redirects the browser to it.
 */
export const useManagePlan = (): ManagePlanResult => {
  const spaceId = useCurrentSpaceId()
  const [trigger, { isFetching }] = useLazyBillingGetSessionUrlV1Query()
  const [error, setError] = useState(false)

  const openPortal = async () => {
    if (!spaceId) return
    setError(false)
    try {
      const { url } = await trigger({ spaceId, returnUrl: getBillingReturnUrl(spaceId) }).unwrap()
      window.location.href = url
    } catch {
      setError(true)
    }
  }

  return { openPortal, isRedirecting: isFetching, error }
}
