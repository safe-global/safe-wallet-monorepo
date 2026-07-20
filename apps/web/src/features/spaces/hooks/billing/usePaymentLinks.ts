import { skipToken } from '@reduxjs/toolkit/query'
import { useBillingGetSpacePaymentLinksV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { PaymentLink } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { useCurrentSpaceId } from '@/features/spaces'

interface PaymentLinksResult {
  paymentLinks: PaymentLink[]
  isLoading: boolean
}

/**
 * Active payment links for the current space — these back the selectable plan
 * cards. Inactive links are filtered out so we never render a plan the user
 * can't actually buy.
 */
export const usePaymentLinks = (): PaymentLinksResult => {
  const spaceId = useCurrentSpaceId()
  const { data, isLoading, isFetching } = useBillingGetSpacePaymentLinksV1Query(spaceId ? { spaceId } : skipToken)

  return {
    paymentLinks: (data ?? []).filter((link) => link.active),
    isLoading: isLoading || isFetching,
  }
}
