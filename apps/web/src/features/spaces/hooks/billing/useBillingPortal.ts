import { useCallback } from 'react'
import { useLazyBillingGetSessionUrlV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { getPortalReturnUrl } from './returnUrl'
import { useBillingSpaceId } from './useBillingSpaceId'
import { navigateTo } from '@/utils/navigation'

export const useBillingPortal = (spaceId?: string | null) => {
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const [trigger, { isFetching, isError }] = useLazyBillingGetSessionUrlV1Query()

  const openPortal = useCallback(async () => {
    if (!gatedSpaceId) return
    const result = await trigger({ spaceId: gatedSpaceId, returnUrl: getPortalReturnUrl(gatedSpaceId) })
    if (result.data) navigateTo(result.data.url)
  }, [gatedSpaceId, trigger])

  return { openPortal, isRedirecting: isFetching, isError }
}
